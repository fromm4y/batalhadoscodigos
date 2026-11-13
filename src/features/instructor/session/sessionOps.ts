/**
 * Ações ao vivo da Narradora (SPEC 7.8, 7.11, 9.3): evento do museu, congelar telas,
 * ajustes por dupla e reorganização dos confrontos.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { pickAbility } from '@/engine/match';
import { getFirebase } from '@/lib/firebase';
import type { AbilityId, MatchDoc, Phase, PlayerDoc, SessionDoc, Side } from '@/types/domain';
import { awardPoints, type Ctx } from './matchOps';

const db = () => getFirebase().db;
const sessionRef = (id: string) => doc(db(), 'sessions', id);
const playerRef = (sessionId: string, teamId: string) =>
  doc(db(), 'sessions', sessionId, 'players', teamId);

/** RN-32: dispara o evento do museu. Só acontece uma vez por sessão (transação). */
export async function triggerMuseumEvent(
  sessionId: string,
  by: 'auto' | 'instructor',
): Promise<boolean> {
  return runTransaction(db(), async (tx) => {
    const snap = await tx.get(sessionRef(sessionId));
    const s = snap.data() as SessionDoc | undefined;
    if (!s || s.museumEvent?.status !== 'idle' || s.phase !== 'locks') return false;
    tx.update(sessionRef(sessionId), {
      museumEvent: { status: 'running', startedAt: serverTimestamp(), triggeredBy: by },
    });
    return true;
  });
}

export async function markMuseumEventDone(sessionId: string, s: SessionDoc): Promise<void> {
  await updateDoc(sessionRef(sessionId), { museumEvent: { ...s.museumEvent, status: 'done' } });
}

/**
 * RN-46: congela/descongela todas as telas. Ao descongelar, o tempo congelado é somado ao
 * início da fase, ao horário do evento automático e à agenda dos robôs.
 */
export async function setFreeze(
  sessionId: string,
  s: SessionDoc,
  active: boolean,
  message = '',
): Promise<void> {
  if (active) {
    await updateDoc(sessionRef(sessionId), {
      freeze: { active: true, message, startedAtMs: Date.now() },
    });
    return;
  }
  const frozenMs = s.freeze?.startedAtMs ? Math.max(0, Date.now() - s.freeze.startedAtMs) : 0;
  const batch = writeBatch(db());
  batch.update(sessionRef(sessionId), {
    freeze: { active: false, message: '', startedAtMs: null },
    ...(frozenMs && s.phaseStartedAt
      ? { phaseStartedAt: Timestamp.fromMillis(s.phaseStartedAt.toMillis() + frozenMs) }
      : {}),
    ...(frozenMs && s.autoEventAt
      ? { autoEventAt: Timestamp.fromMillis(s.autoEventAt.toMillis() + frozenMs) }
      : {}),
  });
  if (frozenMs) {
    const matches = await getDocs(collection(db(), 'sessions', sessionId, 'matches'));
    for (const m of matches.docs) {
      const data = m.data() as MatchDoc;
      if (data.machine?.nextAt)
        batch.update(m.ref, { 'machine.nextAt': data.machine.nextAt + frozenMs });
    }
  }
  await batch.commit();
}

/** RN-47: pontos (±) com lançamento "manual" no extrato. */
export async function givePoints(c: Ctx, teamId: string, delta: number): Promise<void> {
  if (!Number.isInteger(delta) || delta === 0) return;
  await runTransaction(db(), async (tx) => {
    const apply = await awardPoints(tx, db(), c, [{ teamId, reason: 'manual', delta }]);
    apply();
  });
}

/** RN-47: Dica 1 grátis no desafio atual da dupla. */
export async function giveFreeHint(
  sessionId: string,
  teamId: string,
  challengeKey: string,
): Promise<void> {
  await runTransaction(db(), async (tx) => {
    const ref = playerRef(sessionId, teamId);
    const p = (await tx.get(ref)).data() as PlayerDoc | undefined;
    if (!p || (p.hints?.[challengeKey] ?? 0) >= 1) return;
    tx.update(ref, { [`hints.${challengeKey}`]: 1 });
  });
}

/** RN-47: entrega uma habilidade do lado da dupla (sorteada entre as que ela ainda não tem). */
export async function giveAbility(sessionId: string, teamId: string): Promise<AbilityId | null> {
  return runTransaction(db(), async (tx) => {
    const ref = playerRef(sessionId, teamId);
    const p = (await tx.get(ref)).data() as PlayerDoc | undefined;
    if (!p?.side) return null;
    const owned = p.abilities?.owned ?? [];
    const id = pickAbility(p.side, owned);
    if (id) tx.update(ref, { 'abilities.owned': [...owned, id] });
    return id;
  });
}

/** RN-07: libera (ou segura) uma fase só para esta dupla. `null` = segue a turma. */
export async function setPhaseOverride(
  sessionId: string,
  teamId: string,
  phase: Phase | null,
): Promise<void> {
  await updateDoc(playerRef(sessionId, teamId), { phaseOverride: phase });
}

/** RN-14: troca o lado da dupla (antes dos cadeados; use "Desfazer confrontos" se já formou). */
export async function setSide(sessionId: string, teamId: string, side: Side): Promise<void> {
  await updateDoc(playerRef(sessionId, teamId), { side });
}

/** RN-14: desfaz os confrontos para reorganizar pares e lados antes dos cadeados. */
export async function undoMatches(sessionId: string): Promise<void> {
  const matches = await getDocs(collection(db(), 'sessions', sessionId, 'matches'));
  const players = await getDocs(collection(db(), 'sessions', sessionId, 'players'));
  const batch = writeBatch(db());
  for (const p of players.docs)
    if ((p.data() as PlayerDoc).matchId) batch.update(p.ref, { matchId: null });
  batch.update(sessionRef(sessionId), { matchesFormed: false });
  await batch.commit();
  await Promise.all(matches.docs.map((m) => deleteDoc(m.ref)));
}

export async function markHelpDone(sessionId: string, id: string): Promise<void> {
  await updateDoc(doc(db(), 'sessions', sessionId, 'helpRequests', id), { status: 'done' });
}

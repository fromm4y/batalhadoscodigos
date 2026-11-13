/**
 * Ações da dupla que gravam no Firestore (sempre em transação):
 * pontos + ledger + total (RN-22, RN-24), dicas (RN-29), progresso dos cadeados (RN-27) e Cofre.
 */
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';
import { applyDelta, hintCost, POINTS } from '@/engine/scoring';
import { getFirebase } from '@/lib/firebase';
import type { LedgerReason, PlayerDoc, Side, TeamDoc } from '@/types/domain';

export type GameCtx = { sessionId: string; classId: string; teamId: string; episodeId: string };

const refs = (db: Firestore, c: GameCtx) => ({
  team: doc(db, 'classes', c.classId, 'teams', c.teamId),
  player: doc(db, 'sessions', c.sessionId, 'players', c.teamId),
  ledger: collection(db, 'classes', c.classId, 'teams', c.teamId, 'ledger'),
});

type PointsChange = { reason: Exclude<LedgerReason, 'manual'>; delta: number };

/**
 * Aplica vários lançamentos numa transação já aberta (depois das leituras).
 * O ledger guarda o valor que REALMENTE entrou (com a trava do zero), então a soma do ledger
 * sempre bate com o total.
 */
function writePoints(
  tx: Transaction,
  db: Firestore,
  c: GameCtx,
  team: TeamDoc,
  player: PlayerDoc,
  changes: PointsChange[],
  extraPlayer: Record<string, unknown> = {},
) {
  const r = refs(db, c);
  let total = team.totalPoints;
  let episode = player.episodePoints;
  for (const ch of changes) {
    const next = applyDelta(total, ch.delta);
    const effective = next - total;
    total = next;
    episode += effective;
    if (effective !== 0) {
      tx.set(doc(r.ledger), {
        sessionId: c.sessionId,
        episodeId: c.episodeId,
        delta: effective,
        reason: ch.reason,
        at: serverTimestamp(),
        by: 'game',
      });
    }
  }
  if (total !== team.totalPoints) tx.update(r.team, { totalPoints: total });
  tx.update(r.player, { episodePoints: episode, ...extraPlayer });
}

async function readBoth(tx: Transaction, db: Firestore, c: GameCtx) {
  const r = refs(db, c);
  const [t, p] = await Promise.all([tx.get(r.team), tx.get(r.player)]);
  if (!t.exists() || !p.exists()) throw new Error('Dupla ou sessão não encontrada.');
  return { team: t.data() as TeamDoc, player: p.data() as PlayerDoc };
}

/** Resposta errada: −2 (7.6). */
export async function registerWrongAnswer(c: GameCtx): Promise<void> {
  const { db } = getFirebase();
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    writePoints(tx, db, c, team, player, [{ reason: 'wrong_answer', delta: POINTS.wrong_answer }]);
  });
}

/** Compra a dica `tier` do desafio (a Dica 2 só depois da 1). `free` = dica grátis. */
export async function buyHint(
  c: GameCtx,
  challengeKey: string,
  tier: 1 | 2,
  free = false,
): Promise<void> {
  const { db } = getFirebase();
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const used = player.hints?.[challengeKey] ?? 0;
    if (used >= tier) return; // já comprada (clique duplo)
    if (tier === 2 && used < 1) throw new Error('A Dica 2 só abre depois da Dica 1.');
    const cost = hintCost(tier, free);
    writePoints(
      tx,
      db,
      c,
      team,
      player,
      cost ? [{ reason: tier === 1 ? 'hint_1' : 'hint_2', delta: cost }] : [],
      {
        [`hints.${challengeKey}`]: tier,
      },
    );
  });
}

/**
 * Abre o cadeado `index` (0–2): +1, e +3 se for a primeira dupla da turma a abrir esse
 * número (independe do lado). O "primeira" é decidido por um documento que só pode ser criado uma vez.
 */
export async function openLock(c: GameCtx, index: 0 | 1 | 2): Promise<{ first: boolean }> {
  const { db } = getFirebase();
  const firstRef = doc(db, 'sessions', c.sessionId, 'firsts', `lock${index + 1}`);
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const firstSnap = await tx.get(firstRef);
    if (player.progress.lockIndex !== index) return { first: false }; // já aberto (reenvio)
    const first = !firstSnap.exists();
    if (first) tx.set(firstRef, { teamId: c.teamId, at: serverTimestamp() });
    const openedAt = [...player.progress.locksOpenedAt];
    openedAt[index] = Timestamp.now(); // serverTimestamp não é aceito dentro de listas
    const changes: PointsChange[] = [{ reason: 'lock_open', delta: POINTS.lock_open }];
    if (first) changes.push({ reason: 'lock_first', delta: POINTS.lock_first });
    writePoints(tx, db, c, team, player, changes, {
      'progress.lockIndex': index + 1,
      'progress.locksOpenedAt': openedAt,
      solvedCount: player.solvedCount + 1,
    });
    return { first };
  });
}

/** Resolve o Cofre. Os pontos de vitória vêm do confronto (Etapa 4). */
export async function solveVault(c: GameCtx): Promise<void> {
  const { db } = getFirebase();
  await updateDoc(refs(db, c).player, {
    'progress.vaultSolvedAt': serverTimestamp(),
    finishedAt: serverTimestamp(),
  });
}

/** Escolha de lado na fase de planejamento (RN-11). */
export async function chooseSide(c: GameCtx, side: Side): Promise<void> {
  await updateDoc(refs(getFirebase().db, c).player, { side });
}

/** A dupla ouviu a transmissão da Narradora (RN-45): libera o passo que dependia dela. */
export async function markHeardTransmission(c: GameCtx): Promise<void> {
  await updateDoc(refs(getFirebase().db, c).player, { 'progress.heardTransmission': true });
}

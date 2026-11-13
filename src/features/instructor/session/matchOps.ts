/**
 * Operações de confronto feitas pela Narradora (SPEC 7.4, 7.5): formar confrontos (RN-12),
 * vantagem do Cofre (RN-18) e resultado no fim (RN-20).
 */
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';
import { formMatches, leader, resolveByBar } from '@/engine/match';
import { applyDelta, POINTS } from '@/engine/scoring';
import { newMatchDoc } from '@/features/game/actions';
import { getFirebase } from '@/lib/firebase';
import type { LedgerReason, MatchDoc, PlayerDoc, SessionDoc, TeamDoc } from '@/types/domain';

export type Ctx = { sessionId: string; session: SessionDoc; uid: string };

/** Lança pontos numa transação (ledger com `by: uid` da Narradora + total, RN-22/24). */
export async function awardPoints(
  tx: Transaction,
  db: Firestore,
  c: Ctx,
  awards: { teamId: string; reason: LedgerReason; delta: number }[],
) {
  const teamRefs = awards.map((a) => doc(db, 'classes', c.session.classId, 'teams', a.teamId));
  const playerRefs = awards.map((a) => doc(db, 'sessions', c.sessionId, 'players', a.teamId));
  const teams = await Promise.all(teamRefs.map((r) => tx.get(r)));
  const players = await Promise.all(playerRefs.map((r) => tx.get(r)));
  return () =>
    awards.forEach((a, i) => {
      const t = teams[i]!.data() as TeamDoc | undefined;
      const p = players[i]!.data() as PlayerDoc | undefined;
      if (!t || !p) return;
      const total = applyDelta(t.totalPoints, a.delta);
      const effective = total - t.totalPoints;
      if (!effective) return;
      tx.set(doc(collection(db, 'classes', c.session.classId, 'teams', a.teamId, 'ledger')), {
        sessionId: c.sessionId,
        episodeId: c.session.episodeId,
        delta: effective,
        reason: a.reason,
        at: serverTimestamp(),
        by: c.uid,
      });
      tx.update(teamRefs[i]!, { totalPoints: total });
      tx.update(playerRefs[i]!, { episodePoints: p.episodePoints + effective });
    });
}

/** "Formar confrontos" (RN-12): cria os confrontos, liga cada dupla ao seu e dá o bônus de lado vazio. */
export async function formSessionMatches(c: Ctx): Promise<{ matches: number; bonus: number }> {
  const { db } = getFirebase();
  const playersSnap = await getDocs(collection(db, 'sessions', c.sessionId, 'players'));
  const players = playersSnap.docs.map((d) => d.data() as PlayerDoc).filter((p) => !p.matchId);
  const formation = formMatches(
    players.map((p) => ({ teamId: p.teamId, side: p.side, mode: p.mode ?? null })),
  );
  const batch = writeBatch(db);
  for (const m of formation.matches) {
    batch.set(
      doc(db, 'sessions', c.sessionId, 'matches', m.id),
      newMatchDoc(m.redTeamId, m.blueTeamId, m.machineSide),
    );
    for (const [teamId, side] of [
      [m.redTeamId, 'red'],
      [m.blueTeamId, 'blue'],
    ] as const) {
      if (teamId)
        batch.update(doc(db, 'sessions', c.sessionId, 'players', teamId), { matchId: m.id, side });
    }
  }
  batch.update(doc(db, 'sessions', c.sessionId), { matchesFormed: true });
  await batch.commit();

  if (formation.sideBonus.length) {
    await runTransaction(db, async (tx) => {
      const apply = await awardPoints(
        tx,
        db,
        c,
        formation.sideBonus.map((teamId) => ({
          teamId,
          reason: 'side_bonus',
          delta: POINTS.side_bonus,
        })),
      );
      apply();
    });
  }
  return { matches: formation.matches.length, bonus: formation.sideBonus.length };
}

/** RN-18: ao liberar o Cofre, quem está à frente na barra ganha a vantagem (Dica 1 grátis). */
export async function markVaultLeaders(c: Ctx): Promise<void> {
  const { db } = getFirebase();
  const matches = await getDocs(collection(db, 'sessions', c.sessionId, 'matches'));
  const batch = writeBatch(db);
  for (const m of matches.docs) {
    const data = m.data() as MatchDoc;
    if (!data.winner) batch.update(m.ref, { vaultLeader: leader(data.bar) });
  }
  await batch.commit();
}

/**
 * RN-20: ao liberar o fim, confrontos sem Cofre resolvido são decididos pela barra
 * (+5 para o vencedor humano; empate = +2 para cada dupla). A máquina não pontua (RN-23).
 */
export async function resolveOpenMatches(c: Ctx): Promise<number> {
  const { db } = getFirebase();
  const matches = await getDocs(collection(db, 'sessions', c.sessionId, 'matches'));
  let resolved = 0;
  for (const m of matches.docs) {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(m.ref);
      const data = snap.data() as MatchDoc | undefined;
      if (!data || data.winner) return;
      const winner = resolveByBar(data.bar);
      const humans = [
        { teamId: data.redTeamId, side: 'red' as const },
        { teamId: data.blueTeamId, side: 'blue' as const },
      ].filter((h): h is { teamId: string; side: 'red' | 'blue' } => !!h.teamId);
      const awards =
        winner === 'draw'
          ? humans.map((h) => ({ teamId: h.teamId, reason: 'draw' as const, delta: POINTS.draw }))
          : humans
              .filter((h) => h.side === winner)
              .map((h) => ({
                teamId: h.teamId,
                reason: 'vault_win' as const,
                delta: POINTS.vault_win,
              }));
      const apply = await awardPoints(tx, db, c, awards);
      tx.update(m.ref, { winner, resolvedAt: serverTimestamp() });
      apply();
      resolved++;
    });
  }
  return resolved;
}

/**
 * Histórico da turma para a sessão que está abrindo (SPEC-02 C1 e C2):
 * - `played`: episódios que a turma já jogou (para o Álbum saber qual carta foi "perdida");
 * - `previously`: números reais da aula anterior ("Anteriormente na Caçada").
 * Sessões que nunca saíram do lobby não contam. Se a limpeza (A3) apagou a sessão anterior,
 * `previously` fica null e a tela mostra só o resumo do episódio.
 */
import type { Firestore } from 'firebase-admin/firestore';
import type { PreviousSummary, Side } from '../../src/types/domain.js';

type MatchLite = { winner: Side | 'draw' | null; machineSide: Side | null };
type PlayerLite = {
  teamId: string;
  side: Side | null;
  episodePoints: number;
  progress?: { vaultSolvedAt?: unknown };
};
type TeamLite = { cityName: string; pirateName: string };

/** Função pura: resume uma sessão a partir dos confrontos, das duplas e dos nomes. */
export function summarizeSession(
  episodeId: string,
  matches: MatchLite[],
  players: PlayerLite[],
  teams: Record<string, TeamLite>,
): PreviousSummary {
  const wins = { red: 0, blue: 0, machine: 0, draw: 0 };
  for (const m of matches) {
    if (!m.winner) continue;
    if (m.winner === 'draw') wins.draw++;
    else if (m.winner === m.machineSide) wins.machine++;
    else wins[m.winner]++;
  }
  const played = players.filter((p) => p.side);
  const top = [...played].sort((a, b) => b.episodePoints - a.episodePoints)[0];
  const t = top ? teams[top.teamId] : undefined;
  return {
    episodeId,
    wins,
    highlight:
      top && t && top.side && top.episodePoints > 0
        ? {
            name: top.side === 'red' ? t.cityName : t.pirateName,
            side: top.side,
            points: top.episodePoints,
          }
        : null,
    vaultOpened: played.filter((p) => !!p.progress?.vaultSolvedAt).length,
    teams: played.length,
  };
}

export async function classHistory(
  db: Firestore,
  classId: string,
): Promise<{ played: string[]; previously: PreviousSummary | null }> {
  const snap = await db.collection('sessions').where('classId', '==', classId).get();
  const real = snap.docs
    .filter((d) => d.data().phase && d.data().phase !== 'lobby')
    .sort(
      (a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0),
    );
  const played = [...new Set(real.map((d) => d.data().episodeId as string))];
  const last = real[0];
  if (!last) return { played, previously: null };
  const [matches, players, teams] = await Promise.all([
    last.ref.collection('matches').get(),
    last.ref.collection('players').get(),
    db.collection(`classes/${classId}/teams`).get(),
  ]);
  return {
    played,
    previously: summarizeSession(
      last.data().episodeId as string,
      matches.docs.map((d) => d.data() as MatchLite),
      players.docs.map((d) => d.data() as PlayerLite),
      Object.fromEntries(teams.docs.map((d) => [d.id, d.data() as TeamLite])),
    ),
  };
}

/**
 * Ranking da turma (SPEC 7.6, RN-25): ordena pelo total da temporada. Empate divide a posição
 * (1, 1, 3...), e o desempate só de exibição é pelo nome da cidade.
 */
export type Rankable = { id: string; cityName: string; totalPoints: number };
export type RankRow<T extends Rankable> = { team: T; position: number };

export function rankTeams<T extends Rankable>(teams: readonly T[]): RankRow<T>[] {
  const sorted = [...teams].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.cityName.localeCompare(b.cityName, 'pt-BR'),
  );
  const rows: RankRow<T>[] = [];
  sorted.forEach((team, i) => {
    const prev = rows[i - 1];
    const position = prev && prev.team.totalPoints === team.totalPoints ? prev.position : i + 1;
    rows.push({ team, position });
  });
  return rows;
}

/** Soma de um extrato (deve bater com `totalPoints`, RN-24). */
export function ledgerSum(entries: readonly { delta: number }[]): number {
  return entries.reduce((s, e) => s + e.delta, 0);
}

/** Ordem visual do pódio: 2º, 1º, 3º (o 1º no meio, mais alto). */
export function podiumOrder<T>(top: readonly T[]): { item: T; place: 1 | 2 | 3 }[] {
  const out: { item: T; place: 1 | 2 | 3 }[] = [];
  if (top[1] !== undefined) out.push({ item: top[1], place: 2 });
  if (top[0] !== undefined) out.push({ item: top[0], place: 1 });
  if (top[2] !== undefined) out.push({ item: top[2], place: 3 });
  return out;
}

/**
 * Destaque da aula: a(s) dupla(s) que mais pontuaram NESTA sessão (`episodePoints`).
 * Empate → todas aparecem. Ninguém pontuou → sem destaque.
 */
export function sessionHighlights<T extends { teamId: string; episodePoints: number }>(
  players: readonly T[],
): { teamIds: string[]; points: number } | null {
  const best = Math.max(0, ...players.map((p) => p.episodePoints));
  if (best <= 0) return null;
  return {
    teamIds: players.filter((p) => p.episodePoints === best).map((p) => p.teamId),
    points: best,
  };
}

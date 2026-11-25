/**
 * Relatório da turma (SPEC-02 Parte F). Funções puras, usadas no painel e no servidor (por isso
 * os imports relativos com `.js`, como o `gameRules`). Só números: nenhum dado de aluno.
 */
import type { Level } from '../types/domain.js';

/** F1: uma tentativa (cada envio de resposta, certa ou errada). */
export type Attempt = {
  teamId: string;
  episodeId: string;
  challengeKey: string;
  level: Level;
  side: 'red' | 'blue' | 'coop';
  correct: boolean;
  hintLevel: 0 | 1 | 2;
  msSinceChallengeStart: number;
};

export type ChallengeStats = {
  challengeKey: string;
  /** duplas que tentaram */
  teams: number;
  /** duplas que acertaram na primeira tentativa */
  firstTry: number;
  firstTryRate: number;
  avgAttempts: number;
  /** duplas que abriram a Dica 1 / a Dica 2 */
  hint1: number;
  hint2: number;
  /** tempo médio até acertar (s), entre quem acertou */
  avgSeconds: number;
  /** pedidos de ajuda para a Narradora neste desafio */
  help: number;
};

export type PlayerLite = {
  teamId: string;
  side?: string | null;
  mode?: string | null;
  progress?: { eventResult?: string };
};
export type MatchLite = { winner?: string | null; machineSide?: string | null; coop?: unknown };

export type EpisodeReport = {
  episodeId: string;
  sessions: number;
  /** duplas que jogaram (entraram no jogo com lado) */
  teams: number;
  attempts: number;
  firstTryRate: number;
  challenges: ChallengeStats[];
  sides: Record<string, number>;
  modes: Record<string, number>;
  wins: { red: number; blue: number; machine: number; class: number; draw: number };
  event: { ok: number; failed: number; pending: number };
};

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** F2: números por desafio, na ordem em que os desafios aparecem nas tentativas. */
export function challengeStats(
  attempts: readonly Attempt[],
  helpByKey: Record<string, number> = {},
): ChallengeStats[] {
  const keys = [...new Set(attempts.map((a) => a.challengeKey))];
  return keys.map((challengeKey) => {
    const mine = attempts.filter((a) => a.challengeKey === challengeKey);
    const byTeam = new Map<string, Attempt[]>();
    for (const a of mine) byTeam.set(a.teamId, [...(byTeam.get(a.teamId) ?? []), a]);
    const teams = byTeam.size;
    let firstTry = 0;
    let hint1 = 0;
    let hint2 = 0;
    const times: number[] = [];
    for (const list of byTeam.values()) {
      if (list[0]?.correct) firstTry++;
      const maxHint = Math.max(...list.map((a) => a.hintLevel));
      if (maxHint >= 1) hint1++;
      if (maxHint >= 2) hint2++;
      const ok = list.find((a) => a.correct);
      if (ok) times.push(ok.msSinceChallengeStart / 1000);
    }
    return {
      challengeKey,
      teams,
      firstTry,
      firstTryRate: teams ? round(firstTry / teams) : 0,
      avgAttempts: teams ? round(mine.length / teams, 1) : 0,
      hint1,
      hint2,
      avgSeconds: times.length ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : 0,
      help: helpByKey[challengeKey] ?? 0,
    };
  });
}

/** Resumo de um episódio (todas as sessões dele na turma), para a tela e para guardar. */
export function episodeReport(input: {
  episodeId: string;
  sessions: number;
  attempts: readonly Attempt[];
  players: readonly PlayerLite[];
  matches: readonly MatchLite[];
  helpByKey?: Record<string, number>;
}): EpisodeReport {
  const challenges = challengeStats(input.attempts, input.helpByKey);
  const played = input.players.filter((p) => p.side);
  const count = (vals: (string | null | undefined)[]) =>
    vals.reduce<Record<string, number>>((m, v) => {
      if (v) m[v] = (m[v] ?? 0) + 1;
      return m;
    }, {});
  const wins = { red: 0, blue: 0, machine: 0, class: 0, draw: 0 };
  for (const m of input.matches) {
    if (!m.winner) continue;
    if (m.winner === 'draw') wins.draw++;
    else if (m.coop) wins[m.winner === m.machineSide ? 'machine' : 'class']++;
    else if (m.winner === m.machineSide) wins.machine++;
    else if (m.winner === 'red' || m.winner === 'blue') wins[m.winner]++;
  }
  const ev = count(played.map((p) => p.progress?.eventResult ?? 'pending'));
  const firstTries = challenges.reduce((s, c) => s + c.firstTry, 0);
  const tries = challenges.reduce((s, c) => s + c.teams, 0);
  return {
    episodeId: input.episodeId,
    sessions: input.sessions,
    teams: new Set(played.map((p) => p.teamId)).size,
    attempts: input.attempts.length,
    firstTryRate: tries ? round(firstTries / tries) : 0,
    challenges,
    sides: count(played.map((p) => p.side)),
    modes: count(played.map((p) => p.mode)),
    wins,
    event: { ok: ev.ok ?? 0, failed: ev.failed ?? 0, pending: ev.pending ?? 0 },
  };
}

/** Nome da dupla no CSV: "Dupla 01", "Dupla 02"... por padrão (LGPD). */
export function teamLabels(
  teamIds: readonly string[],
  names: Record<string, string>,
  anonymize: boolean,
): Record<string, string> {
  const sorted = [...new Set(teamIds)].sort((a, b) =>
    (names[a] ?? a).localeCompare(names[b] ?? b, 'pt-BR'),
  );
  return Object.fromEntries(
    sorted.map((id, i) => [
      id,
      anonymize ? `Dupla ${String(i + 1).padStart(2, '0')}` : (names[id] ?? id),
    ]),
  );
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV (separado por ";", abre direto no Excel em português): uma linha por tentativa. */
export function attemptsCsv(
  attempts: readonly Attempt[],
  names: Record<string, string>,
  anonymize = true,
): string {
  const label = teamLabels(
    attempts.map((a) => a.teamId),
    names,
    anonymize,
  );
  const head = ['dupla', 'episodio', 'desafio', 'nivel', 'lado', 'certa', 'dica', 'segundos'];
  const rows = attempts.map((a) => [
    label[a.teamId] ?? a.teamId,
    a.episodeId,
    a.challengeKey,
    a.level,
    a.side,
    a.correct ? 'sim' : 'nao',
    a.hintLevel,
    Math.round(a.msSinceChallengeStart / 1000),
  ]);
  return [head, ...rows].map((r) => r.map(cell).join(';')).join('\n');
}

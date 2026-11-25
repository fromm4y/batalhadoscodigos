import { describe, expect, it } from 'vitest';
import { attemptsCsv, challengeStats, episodeReport, teamLabels, type Attempt } from './report';

const a = (
  teamId: string,
  challengeKey: string,
  correct: boolean,
  hintLevel: 0 | 1 | 2 = 0,
  ms = 60_000,
): Attempt => ({
  teamId,
  episodeId: 'ep1',
  challengeKey,
  level: 'B',
  side: 'red',
  correct,
  hintLevel,
  msSinceChallengeStart: ms,
});

// 2 duplas, contagem manual (aceite F): no red-lock1, R acerta de primeira em 30 s;
// B erra, abre a Dica 1 e acerta em 90 s. No red-lock2, só R tenta e acerta de primeira.
const attempts = [
  a('R', 'red-lock1', true, 0, 30_000),
  a('B', 'red-lock1', false),
  a('B', 'red-lock1', true, 1, 90_000),
  a('R', 'red-lock2', true, 0, 40_000),
];

describe('relatório da turma (SPEC-02 F)', () => {
  it('acerto de primeira, tentativas, dicas, tempo e ajuda por desafio', () => {
    const [l1, l2] = challengeStats(attempts, { 'red-lock1': 1 });
    expect(l1).toEqual({
      challengeKey: 'red-lock1',
      teams: 2,
      firstTry: 1,
      firstTryRate: 0.5,
      avgAttempts: 1.5,
      hint1: 1,
      hint2: 0,
      avgSeconds: 60,
      help: 1,
    });
    expect(l2).toMatchObject({ teams: 1, firstTry: 1, firstTryRate: 1, avgSeconds: 40, help: 0 });
  });
  it('resumo do episódio: lados, modos, vitórias e evento do museu', () => {
    const r = episodeReport({
      episodeId: 'ep1',
      sessions: 1,
      attempts,
      players: [
        { teamId: 'R', side: 'red', mode: 'pessoas', progress: { eventResult: 'ok' } },
        { teamId: 'B', side: 'blue', mode: 'maquina', progress: { eventResult: 'failed' } },
        { teamId: 'X', side: null },
      ],
      matches: [
        { winner: 'red', machineSide: null },
        { winner: 'red', machineSide: 'red' },
      ],
    });
    expect(r.teams).toBe(2);
    expect(r.attempts).toBe(4);
    expect(r.firstTryRate).toBe(0.67); // 2 primeiras certas em 3 (dupla × desafio)
    expect(r.sides).toEqual({ red: 1, blue: 1 });
    expect(r.modes).toEqual({ pessoas: 1, maquina: 1 });
    expect(r.wins).toMatchObject({ red: 1, machine: 1 });
    expect(r.event).toEqual({ ok: 1, failed: 1, pending: 0 });
  });
  it('CSV anonimizado por padrão: "Dupla 01", sem o nome da dupla', () => {
    const csv = attemptsCsv(attempts, { R: 'Recife', B: 'Belém' });
    expect(csv).not.toMatch(/Recife|Belém/);
    expect(csv.split('\n')[1]).toMatch(/^Dupla 02;ep1;red-lock1;B;red;sim;0;30$/);
    expect(attemptsCsv(attempts, { R: 'Recife', B: 'Belém' }, false)).toMatch(/Recife/);
    expect(teamLabels(['R', 'B'], { R: 'Recife', B: 'Belém' }, true)).toEqual({
      B: 'Dupla 01',
      R: 'Dupla 02',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { summarizeSession } from './history.js';

describe('Anteriormente na Caçada (SPEC-02 C1)', () => {
  it('conta vitórias por lado, a dupla destaque e quem abriu o Cofre', () => {
    const s = summarizeSession(
      'ep1',
      [
        { winner: 'red', machineSide: null },
        { winner: 'blue', machineSide: 'red' },
        { winner: 'red', machineSide: 'red' },
        { winner: 'draw', machineSide: null },
        { winner: null, machineSide: null },
      ],
      [
        { teamId: 'a', side: 'red', episodePoints: 9, progress: { vaultSolvedAt: 1 } },
        { teamId: 'b', side: 'blue', episodePoints: 12, progress: { vaultSolvedAt: 1 } },
        { teamId: 'c', side: 'blue', episodePoints: 3, progress: {} },
        { teamId: 'faltou', side: null, episodePoints: 0 },
      ],
      {
        a: { cityName: 'Recife', pirateName: 'Maré Alta' },
        b: { cityName: 'Natal', pirateName: 'Pérola Azul' },
      },
    );
    expect(s.wins).toEqual({ red: 1, blue: 1, machine: 1, draw: 1 });
    expect(s.highlight).toEqual({ name: 'Pérola Azul', side: 'blue', points: 12 });
    expect(s.vaultOpened).toBe(2);
    expect(s.teams).toBe(3);
  });
  it('sem pontos, sem destaque', () => {
    const s = summarizeSession('ep1', [], [{ teamId: 'a', side: 'red', episodePoints: 0 }], {
      a: { cityName: 'Recife', pirateName: 'X' },
    });
    expect(s.highlight).toBeNull();
  });
});

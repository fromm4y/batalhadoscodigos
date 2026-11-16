import { describe, expect, it } from 'vitest';
import type { PlayerDoc } from '@/types/domain';
import { raceOrder, raceSteps } from './race';

const t = (ms: number) => ({ toMillis: () => ms });
function p(
  id: string,
  lockIndex: 0 | 1 | 2 | 3,
  opened: number[],
  vault: number | null = null,
  side: 'red' | 'blue' | null = 'red',
) {
  return {
    id,
    side,
    progress: {
      lockIndex,
      locksOpenedAt: opened.map(t),
      vaultSolvedAt: vault === null ? null : t(vault),
    },
  } as unknown as Pick<PlayerDoc, 'progress' | 'side'> & { id: string };
}

describe('corrida até o Cofre (projetor)', () => {
  it('conta cadeados + Cofre', () => {
    expect(raceSteps(p('a', 3, [1, 2, 3], 9))).toBe(4);
    expect(raceSteps(p('a', 2, [1, 2]))).toBe(2);
  });
  it('mais passos primeiro; empate de passos: quem chegou antes', () => {
    const order = raceOrder([
      p('lento', 2, [10, 50]),
      p('cofre', 3, [5, 6, 7], 20),
      p('rapido', 2, [10, 30]),
      p('zero', 0, []),
    ]).map((r) => [r.player.id, r.place]);
    expect(order).toEqual([
      ['cofre', 1],
      ['rapido', 2],
      ['lento', 3],
      ['zero', 4],
    ]);
  });
  it('quem não começou divide a posição; sem lado fica de fora', () => {
    const order = raceOrder([p('a', 0, []), p('b', 0, []), p('c', 1, [5], null, null)]);
    expect(order.map((r) => r.place)).toEqual([1, 1]);
  });
});

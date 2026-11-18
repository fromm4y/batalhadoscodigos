import { describe, expect, it } from 'vitest';
import ep5 from '@/content/episodes/ep5.json';
import type { CoopEpisode } from '@/content/types';
import {
  asVersus,
  canReinforce,
  classWins,
  coopEndAwards,
  coopPull,
  newCoopState,
  reinforceTargets,
  reinforcementFor,
  vaultGoal,
} from './coop';
import { resolveChallenge } from './challenges';

describe('modo coop (SPEC-03 §4.1)', () => {
  it('RN-C3: puxão = 15 / duplas (mínimo 1)', () => {
    expect(coopPull(20, 1)).toBe(15);
    expect(coopPull(20, 3)).toBe(5);
    expect(coopPull(20, 5)).toBe(3);
    expect(coopPull(10, 3)).toBe(3); // etapa 1 = meio puxão
    expect(coopPull(20, 40)).toBe(1);
  });
  it('RN-C5 + CHEFÃO (18/11): 2/3 das duplas (para cima) vencem', () => {
    expect(vaultGoal(1)).toBe(1);
    expect(vaultGoal(3)).toBe(2);
    expect(vaultGoal(4)).toBe(3);
    expect(vaultGoal(10)).toBe(7);
    const st = { ...newCoopState(['a', 'b', 'c', 'd']), vaultSolvers: ['a', 'b'] };
    expect(classWins(st)).toBe(false);
    expect(classWins({ ...st, vaultSolvers: ['a', 'b', 'c'] })).toBe(true);
  });
  it('RN-C6: +5 para todas se a turma vence, +2 se a máquina vence', () => {
    const st = newCoopState(['a', 'b']);
    expect(coopEndAwards(st, 'red').map((a) => [a.teamId, a.delta])).toEqual([
      ['a', 5],
      ['b', 5],
    ]);
    expect(coopEndAwards(st, 'blue').every((a) => a.delta === 2 && a.reason === 'coop_play')).toBe(
      true,
    );
  });
  it('RN-C7: reforço só de quem abriu o Cofre, uma vez, para quem ainda não terminou', () => {
    let st = { ...newCoopState(['a', 'b', 'c']), vaultSolvers: ['a'] };
    expect(canReinforce(st, 'a')).toBe(true);
    expect(canReinforce(st, 'b')).toBe(false);
    expect(reinforceTargets(st)).toEqual(['b', 'c']);
    st = { ...st, reinforcements: { a: 'b' } };
    expect(canReinforce(st, 'a')).toBe(false);
    expect(reinforceTargets(st)).toEqual(['c']);
    expect(reinforcementFor(st, 'b')).toBe('a');
    expect(reinforcementFor(st, 'c')).toBeNull();
  });
  it('o loader entrega o cooperativo com a Aliança nos dois lados', () => {
    const e = asVersus(ep5 as unknown as CoopEpisode);
    expect(e.alliance).toBe(true);
    expect(e.sides.red.name).toBe('A Aliança');
    expect(resolveChallenge(e, 'blue', 'A', 2).key).toBe('coop-lock3');
    expect(e.intro.red).toBe(e.intro.blue);
  });
});

import { describe, expect, it } from 'vitest';
import { GAME_RULES } from '@/config/gameRules';
import type { ActiveEffect } from '@/types/domain';
import {
  abilityEffect,
  applyPull,
  barFavorsRival,
  earnsAbility,
  formMatches,
  machineDelayMs,
  pickAbility,
  resolveByBar,
  type Candidate,
} from './match';

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length]!;
};
const c = (
  teamId: string,
  side: 'red' | 'blue' | null,
  mode: 'pessoas' | 'maquina' | null = 'pessoas',
): Candidate => ({
  teamId,
  side,
  mode,
});

describe('formação dos confrontos (RN-12, RN-13)', () => {
  it('forma pares red × blue entre quem escolheu pessoas', () => {
    const f = formMatches(
      [c('r1', 'red'), c('b1', 'blue'), c('r2', 'red'), c('b2', 'blue')],
      seq([0.1]),
    );
    expect(f.matches).toHaveLength(2);
    expect(f.matches.every((m) => m.redTeamId && m.blueTeamId && !m.machineSide)).toBe(true);
    expect(f.sideBonus).toEqual([]);
  });

  it('quem sobra joga contra a máquina no lado que escolheu', () => {
    const f = formMatches([c('r1', 'red'), c('r2', 'red'), c('b1', 'blue')]);
    const machine = f.matches.filter((m) => m.machineSide);
    expect(machine).toHaveLength(1);
    expect(machine[0]!.machineSide).toBe('blue');
    expect([machine[0]!.redTeamId]).not.toContain(null);
  });

  it('modo máquina sempre contra o robô', () => {
    const f = formMatches([c('r1', 'red', 'maquina'), c('b1', 'blue'), c('r2', 'red')]);
    const r1 = f.matches.find((m) => m.redTeamId === 'r1')!;
    expect(r1.machineSide).toBe('blue');
    expect(f.matches.find((m) => m.redTeamId === 'r2')!.blueTeamId).toBe('b1');
  });

  it('uma única dupla joga contra a máquina, mesmo tendo escolhido pessoas (RN-13)', () => {
    const f = formMatches([c('solo', 'blue')]);
    expect(f.matches).toEqual([
      { id: 'maq_solo', redTeamId: null, blueTeamId: 'solo', machineSide: 'red' },
    ]);
  });

  it('bônus de lado vazio: diferença de 2 ou mais dá +2 para o lado menor', () => {
    const f = formMatches([c('r1', 'red'), c('r2', 'red'), c('r3', 'red'), c('b1', 'blue')]);
    expect(f.sideBonus).toEqual(['b1']);
    const g = formMatches([c('r1', 'red'), c('r2', 'red'), c('b1', 'blue')]);
    expect(g.sideBonus).toEqual([]);
  });

  it('quem não escolheu lado vai para o lado com menos gente', () => {
    const f = formMatches([c('r1', 'red'), c('x', null, null)]);
    expect(f.matches).toEqual([
      { id: 'pvp_r1_x', redTeamId: 'r1', blueTeamId: 'x', machineSide: null },
    ]);
  });

  it('todo mundo tem exatamente um confronto', () => {
    const all = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id, i) =>
      c(id, i % 3 ? 'red' : 'blue', i === 4 ? 'maquina' : 'pessoas'),
    );
    const f = formMatches(all);
    const ids = f.matches.flatMap((m) => [m.redTeamId, m.blueTeamId]).filter(Boolean);
    expect(ids.sort()).toEqual(all.map((x) => x.teamId).sort());
  });
});

describe('cabo de guerra (RN-15 a RN-21)', () => {
  const lock = GAME_RULES.pull.lockOpen;
  it('Bando puxa para o negativo, Piratas para o positivo', () => {
    expect(applyPull({ bar: 0, effects: [] }, 'red', lock, 0).bar).toBe(-lock);
    expect(applyPull({ bar: 0, effects: [] }, 'blue', lock, 0).bar).toBe(lock);
  });
  it('a barra trava em ±60 antes do Cofre (RN-17)', () => {
    let bar = 0;
    for (let i = 0; i < 5; i++) bar = applyPull({ bar, effects: [] }, 'red', lock, 0).bar;
    expect(bar).toBe(-GAME_RULES.bar.preVaultLimit);
  });
  it('Âncora: puxões do alvo valem metade enquanto dura', () => {
    const anchor: ActiveEffect = { kind: 'anchor', target: 'red', until: 1000 };
    expect(applyPull({ bar: 0, effects: [anchor] }, 'red', 20, 500).bar).toBe(-10);
    expect(applyPull({ bar: 0, effects: [anchor] }, 'red', 20, 1500).bar).toBe(-20);
    expect(applyPull({ bar: 0, effects: [anchor] }, 'blue', 20, 500).bar).toBe(20);
  });
  it('Escudo anula só o próximo puxão do alvo e some', () => {
    const shield: ActiveEffect = { kind: 'shield', target: 'red' };
    const r1 = applyPull({ bar: 10, effects: [shield] }, 'red', 20, 0);
    expect(r1).toMatchObject({ bar: 10, blocked: true, effects: [] });
    expect(applyPull({ bar: r1.bar, effects: r1.effects }, 'red', 20, 0).bar).toBe(-10);
  });
  it('fim sem Cofre: vence quem a barra favorece; 0 é empate (RN-20)', () => {
    expect(resolveByBar(-5)).toBe('red');
    expect(resolveByBar(5)).toBe('blue');
    expect(resolveByBar(0)).toBe('draw');
    expect(barFavorsRival(-20, 'blue')).toBe(true);
    expect(barFavorsRival(-20, 'red')).toBe(false);
  });
});

describe('habilidades (7.9)', () => {
  it('ganha a cada 2 desafios; a cada 1 se estiver perdendo (RN-37, RN-38)', () => {
    expect([1, 2, 3, 4].map((n) => earnsAbility(n, false))).toEqual([false, true, false, true]);
    expect([1, 2, 3].map((n) => earnsAbility(n, true))).toEqual([true, true, true]);
  });
  it('sorteia só habilidades do próprio lado que ainda não tem', () => {
    expect(pickAbility('red', ['interferencia', 'disfarce'])).toBe('planoB');
    expect(pickAbility('blue', ['ancora', 'escudo', 'bussola'])).toBeNull();
  });
  it('efeitos espelhados miram o rival', () => {
    expect(abilityEffect('interferencia', 'red', 0)).toEqual({
      kind: 'effect',
      effect: { kind: 'freeze', target: 'blue', until: 10_000 },
    });
    expect(abilityEffect('ancora', 'blue', 0)).toEqual({
      kind: 'effect',
      effect: { kind: 'anchor', target: 'red', until: 30_000 },
    });
    expect(abilityEffect('disfarce', 'red', 0)).toEqual({
      kind: 'effect',
      effect: { kind: 'disguise', target: 'blue', until: 30_000 },
    });
    expect(abilityEffect('escudo', 'blue', 0)).toEqual({
      kind: 'effect',
      effect: { kind: 'shield', target: 'red' },
    });
    expect(abilityEffect('planoB', 'red', 0)).toEqual({ kind: 'freeHint' });
  });
});

describe('máquina (RN-42)', () => {
  it('sorteia o tempo dentro do intervalo do nível', () => {
    expect(machineDelayMs('A', 'lock', () => 0)).toBe(150_000);
    expect(machineDelayMs('A', 'lock', () => 1)).toBe(210_000);
    expect(machineDelayMs('C', 'vault', () => 0.5)).toBe(250_000);
  });
});

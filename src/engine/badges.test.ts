import { describe, expect, it } from 'vitest';
import {
  addBadges,
  addStamp,
  badgeCounts,
  badgesEarned,
  stampResult,
  teamLevel,
  type BadgeInput,
} from './badges';

const base: BadgeInput = {
  episodeId: 'ep2',
  side: 'red',
  winner: 'blue',
  vaultLeader: null,
  vaultSolved: false,
  fastestVault: false,
  hints: { 'red-lock1': 1 },
  misses: {},
  spokenKeys: ['red-lock3'],
  spokenOpened: false,
  bonusSolved: false,
  stamps: [{ episodeId: 'ep2', side: 'red', result: 'perdeu' }],
  cardEpisodes: ['ep2'],
  seasonEpisodes: ['ep1', 'ep2', 'ep3', 'ep5'],
};

describe('ficha que evolui (SPEC-02 D1)', () => {
  it('nível pelos episódios jogados, com nomes do Bando e dos Piratas', () => {
    expect(teamLevel(0, 'red')).toBe('Novato');
    expect(teamLevel(1, 'red')).toBe('Recruta');
    expect(teamLevel(4, 'blue')).toBe('Capitão de Fragata');
    expect(teamLevel(5, 'red')).toBe('Lenda');
    expect(teamLevel(9, 'blue')).toBe('Lenda dos Mares');
  });
  it('carimbo: resultado e troca do mesmo episódio', () => {
    expect(stampResult('red', 'red')).toBe('venceu');
    expect(stampResult('red', 'blue')).toBe('perdeu');
    expect(stampResult('blue', 'draw')).toBe('empate');
    expect(stampResult('blue', null)).toBe('jogou');
    const s = addStamp([{ episodeId: 'ep1', side: 'red', result: 'perdeu' }], {
      episodeId: 'ep1',
      side: 'blue',
      result: 'venceu',
    });
    expect(s).toEqual([{ episodeId: 'ep1', side: 'blue', result: 'venceu' }]);
  });
});

describe('selos (SPEC-02 D2): um teste para cada', () => {
  it('nenhum selo à toa', () => expect(badgesEarned(base)).toEqual([]));
  it('⚡ Cofre Relâmpago: o Cofre mais rápido da turma', () => {
    expect(badgesEarned({ ...base, vaultSolved: true, fastestVault: true })).toContain(
      'cofreRelampago',
    );
    expect(badgesEarned({ ...base, vaultSolved: true, fastestVault: false })).not.toContain(
      'cofreRelampago',
    );
  });
  it('🧠 Sem Dicas: terminou sem abrir dica', () => {
    expect(badgesEarned({ ...base, vaultSolved: true, hints: {} })).toContain('semDicas');
    expect(badgesEarned({ ...base, vaultSolved: true })).not.toContain('semDicas');
    expect(badgesEarned({ ...base, vaultSolved: false, hints: {} })).not.toContain('semDicas');
  });
  it('🔄 Virada: venceu começando o Cofre atrás', () => {
    expect(badgesEarned({ ...base, winner: 'red', vaultLeader: 'blue' })).toContain('virada');
    expect(badgesEarned({ ...base, winner: 'red', vaultLeader: 'red' })).not.toContain('virada');
    expect(badgesEarned({ ...base, winner: 'blue', vaultLeader: 'blue' })).not.toContain('virada');
  });
  it('🎭 Duas Caras: já jogou nos dois lados', () => {
    const stamps = [
      { episodeId: 'ep1', side: 'blue' as const, result: 'venceu' as const },
      ...base.stamps,
    ];
    expect(badgesEarned({ ...base, stamps })).toContain('duasCaras');
  });
  it('🎧 Ouvido Atento: pista falada de primeira, sem dica', () => {
    expect(badgesEarned({ ...base, spokenOpened: true })).toContain('ouvidoAtento');
    expect(badgesEarned({ ...base, spokenOpened: true, misses: { 'red-lock3': 1 } })).not.toContain(
      'ouvidoAtento',
    );
    expect(badgesEarned({ ...base, spokenOpened: false })).not.toContain('ouvidoAtento');
  });
  it('🗂️ Colecionador: todas as cartas da temporada', () => {
    expect(badgesEarned({ ...base, cardEpisodes: ['ep1', 'ep2', 'ep3', 'ep5'] })).toContain(
      'colecionador',
    );
    expect(badgesEarned({ ...base, cardEpisodes: ['ep1', 'ep2', 'ep3'] })).not.toContain(
      'colecionador',
    );
  });
  it('🌟 Missão Bônus', () => {
    expect(badgesEarned({ ...base, bonusSolved: true })).toContain('missaoBonus');
  });
  it('não repete: por episódio, e os de "uma vez" só uma vez na temporada', () => {
    let b = addBadges([], ['cofreRelampago', 'duasCaras'], 'ep1', 1);
    b = addBadges(b, ['cofreRelampago', 'duasCaras'], 'ep1', 2);
    expect(b).toHaveLength(2);
    b = addBadges(b, ['cofreRelampago', 'duasCaras'], 'ep2', 3);
    expect(b).toHaveLength(3);
    expect(badgeCounts(b)).toEqual([
      ['cofreRelampago', 2],
      ['duasCaras', 1],
    ]);
  });
});

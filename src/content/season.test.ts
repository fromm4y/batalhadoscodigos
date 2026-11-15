import { describe, expect, it } from 'vitest';
import { hookFor, nextInSeason, seasonEpisodes, seasonFromDate } from './season';
import { levelFromGrade } from '@/config/gameRules';

describe('seasonFromDate', () => {
  it('gera o trimestre a partir da data', () => {
    expect(seasonFromDate(new Date(2026, 10, 17))).toBe('2026-T4');
    expect(seasonFromDate(new Date(2027, 0, 5))).toBe('2027-T1');
  });
});

describe('levelFromGrade', () => {
  it('mapeia série para nível (RN-01)', () => {
    expect([4, 5, 6, 7, 8, 9].map(levelFromGrade)).toEqual(['A', 'A', 'B', 'B', 'C', 'C']);
  });
});

describe('temporada dinâmica (SPEC-02 Parte B)', () => {
  it('ordem longa e curta', () => {
    expect(seasonEpisodes('long').map((e) => e.id)).toEqual(['ep1', 'ep2', 'ep3', 'ep4', 'ep5']);
    expect(seasonEpisodes('short').map((e) => e.id)).toEqual(['ep1', 'ep2', 'ep4', 'ep5']);
    expect(nextInSeason('short', 'ep2')).toBe('ep4');
    expect(nextInSeason('long', 'ep5')).toBeNull();
  });
  it('na temporada curta, o gancho do fim do Ep. 2 aponta para o Ep. 4 (aceite B)', () => {
    expect(hookFor('long', 'ep2')).toEqual({ kind: 'next', nextId: 'ep3', teaserFrom: 'ep2' });
    expect(hookFor('short', 'ep2')).toEqual({ kind: 'next', nextId: 'ep4', teaserFrom: 'ep3' });
    expect(hookFor('long', 'ep1')).toEqual({ kind: 'next', nextId: 'ep2', teaserFrom: 'ep1' });
  });
  it('no último episódio, encerramento da temporada', () => {
    expect(hookFor('short', 'ep5')).toEqual({ kind: 'seasonEnd', teaserFrom: 'ep5' });
  });
});

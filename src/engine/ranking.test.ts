import { describe, expect, it } from 'vitest';
import { ledgerSum, podiumOrder, rankTeams, sessionHighlights } from './ranking';

const t = (id: string, cityName: string, totalPoints: number) => ({ id, cityName, totalPoints });

describe('ranking da turma', () => {
  it('ordena por pontos e desempata a exibição pelo nome', () => {
    const r = rankTeams([t('a', 'Recife', 5), t('b', 'Belém', 9), t('c', 'Atibaia', 5)]);
    expect(r.map((x) => x.team.id)).toEqual(['b', 'c', 'a']);
  });
  it('empate divide a posição (1, 2, 2, 4)', () => {
    const r = rankTeams([t('a', 'A', 9), t('b', 'B', 4), t('c', 'C', 4), t('d', 'D', 1)]);
    expect(r.map((x) => x.position)).toEqual([1, 2, 2, 4]);
  });
  it('não altera a lista original', () => {
    const list = [t('a', 'A', 1), t('b', 'B', 2)];
    rankTeams(list);
    expect(list[0]!.id).toBe('a');
  });
  it('soma o extrato', () => {
    expect(ledgerSum([{ delta: 3 }, { delta: -2 }, { delta: 1 }])).toBe(2);
    expect(ledgerSum([])).toBe(0);
  });
  it('pódio na ordem 2º, 1º, 3º, mesmo com menos de 3 duplas', () => {
    expect(podiumOrder(['x', 'y', 'z']).map((p) => p.place)).toEqual([2, 1, 3]);
    expect(podiumOrder(['x']).map((p) => p.item)).toEqual(['x']);
    expect(podiumOrder(['x', 'y']).map((p) => p.place)).toEqual([2, 1]);
  });
});

describe('destaque da aula', () => {
  const p = (teamId: string, episodePoints: number) => ({ teamId, episodePoints });
  it('quem mais pontuou hoje, mesmo atrás no total da temporada', () => {
    expect(sessionHighlights([p('a', 4), p('b', 9), p('c', 2)])).toEqual({
      teamIds: ['b'],
      points: 9,
    });
  });
  it('empate mostra todas', () => {
    expect(sessionHighlights([p('a', 5), p('b', 5)])?.teamIds).toEqual(['a', 'b']);
  });
  it('ninguém pontuou → sem destaque', () => {
    expect(sessionHighlights([p('a', 0)])).toBeNull();
    expect(sessionHighlights([])).toBeNull();
  });
});

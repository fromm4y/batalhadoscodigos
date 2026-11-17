import { describe, expect, it } from 'vitest';
import type { PreviousSummary } from '@/types/domain';
import { previousEpisodeId } from './previousEpisode';

const prev = (episodeId: string) => ({ episodeId }) as PreviousSummary;

describe('episódio da aula anterior (SPEC-02 C1)', () => {
  it('usa a última sessão da turma', () => {
    expect(
      previousEpisodeId(
        { episodeId: 'ep3', history: { played: [], previously: prev('ep1') } },
        'long',
      ),
    ).toBe('ep1');
  });
  it('sessão anterior apagada: o episódio anterior da temporada ativa', () => {
    expect(previousEpisodeId({ episodeId: 'ep4' }, 'long')).toBe('ep3');
    // curta (17/11): ep1, ep2, ep3, ep5 → antes do Ep. 5 vem o ENIAC
    expect(previousEpisodeId({ episodeId: 'ep5' }, 'short')).toBe('ep3');
  });
  it('primeiro episódio (ou repetindo o mesmo): nada antes', () => {
    expect(previousEpisodeId({ episodeId: 'ep1' }, 'long')).toBeNull();
    expect(
      previousEpisodeId(
        { episodeId: 'ep1', history: { played: [], previously: prev('ep1') } },
        'long',
      ),
    ).toBeNull();
  });
});

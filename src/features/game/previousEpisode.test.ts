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
    expect(previousEpisodeId({ episodeId: 'ep4' }, 'short')).toBe('ep2');
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

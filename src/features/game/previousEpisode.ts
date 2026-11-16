import { seasonEpisodes, type SeasonOrder } from '@/content/season';
import type { SessionDoc } from '@/types/domain';

/**
 * Episódio da "aula anterior" (SPEC-02 C1): o da última sessão da turma; se ela foi apagada pela
 * limpeza, o episódio anterior na temporada ativa. `null` no primeiro episódio.
 */
export function previousEpisodeId(
  session: Pick<SessionDoc, 'episodeId' | 'history'>,
  order: SeasonOrder,
): string | null {
  const prev = session.history?.previously?.episodeId;
  if (prev && prev !== session.episodeId) return prev;
  const eps = seasonEpisodes(order).map((e) => e.id);
  const i = eps.indexOf(session.episodeId);
  return i > 0 ? eps[i - 1]! : null;
}

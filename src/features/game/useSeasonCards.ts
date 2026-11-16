import { useEffect, useState } from 'react';
import { loadAnyEpisode } from '@/content/episodes';
import { SEASON } from '@/content/season';
import type { AnyEpisode } from '@/content/types';

/** O que o Álbum e o certificado precisam de cada episódio. */
export type SeasonCardInfo = Pick<
  AnyEpisode,
  'id' | 'number' | 'title' | 'card' | 'certificate' | 'invention' | 'recapOfThis'
>;

let cache: Record<string, SeasonCardInfo> | null = null;

/** Carrega as cartas de todos os episódios da temporada (os JSON são pequenos; fica em cache). */
export function useSeasonCards(): Record<string, SeasonCardInfo> | null {
  const [cards, setCards] = useState(cache);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    void Promise.all(SEASON.map((s) => loadAnyEpisode(s.id))).then((eps) => {
      cache = Object.fromEntries(eps.filter((e): e is AnyEpisode => !!e).map((e) => [e.id, e]));
      if (alive) setCards(cache);
    });
    return () => {
      alive = false;
    };
  }, []);
  return cards;
}

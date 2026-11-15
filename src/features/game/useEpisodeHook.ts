import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { loadAnyEpisode } from '@/content/episodes';
import { DEFAULT_SEASON_ORDER, hookFor, isSeasonOrder, type SeasonOrder } from '@/content/season';
import { getFirebase, type FirebaseRole } from '@/lib/firebase';

/** Ordem da temporada escolhida pela admin (`config/season`); padrão: longa. */
export function useSeasonOrder(role: FirebaseRole): SeasonOrder {
  const [order, setOrder] = useState<SeasonOrder>(DEFAULT_SEASON_ORDER);
  useEffect(
    () =>
      onSnapshot(
        doc(getFirebase(role).db, 'config', 'season'),
        (snap) => {
          const o: unknown = snap.data()?.order;
          setOrder(isSeasonOrder(o) ? o : DEFAULT_SEASON_ORDER);
        },
        () => setOrder(DEFAULT_SEASON_ORDER),
      ),
    [role],
  );
  return order;
}

export type EpisodeHook = { kind: 'next' | 'seasonEnd'; line: string; art: string };

/** Gancho do fim do episódio, conforme a temporada ativa (SPEC-02 Parte B). */
export function useEpisodeHook(role: FirebaseRole, episodeId: string): EpisodeHook | null {
  const order = useSeasonOrder(role);
  const h = hookFor(order, episodeId);
  const [hook, setHook] = useState<{ key: string; value: EpisodeHook } | null>(null);
  const key = `${h.kind}:${h.teaserFrom}`;
  useEffect(() => {
    let alive = true;
    void loadAnyEpisode(h.teaserFrom).then((e) => {
      if (alive && e)
        setHook({ key, value: { kind: h.kind, line: e.teaser.line, art: e.teaser.art } });
    });
    return () => {
      alive = false;
    };
  }, [key, h.kind, h.teaserFrom]);
  return hook?.key === key ? hook.value : null;
}

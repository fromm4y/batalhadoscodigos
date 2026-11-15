import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ComicPanel, cn } from '@/components/comic';
import { SEASON_ORDER_LABEL, seasonEpisodes, type SeasonOrder } from '@/content/season';
import { useSeasonOrder } from '@/features/game/useEpisodeHook';
import { getFirebase } from '@/lib/firebase';

/**
 * Temporada longa ou curta (SPEC-02 Parte B). Muda o gancho do fim de cada episódio:
 * na curta, o fim do Ep. 2 já anuncia a Apollo 11.
 */
export function SeasonOrderPanel({ uid }: { uid: string }) {
  const order = useSeasonOrder('instructor');
  const [error, setError] = useState<string | null>(null);

  async function choose(o: SeasonOrder) {
    setError(null);
    try {
      await setDoc(doc(getFirebase().db, 'config', 'season'), {
        order: o,
        updatedAt: serverTimestamp(),
        by: uid,
      });
    } catch (err) {
      console.error('[temporada]', err);
      setError('Não consegui salvar. Tente de novo.');
    }
  }

  return (
    <ComicPanel caption="Temporada" tone="graphite" className="pt-8">
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-type text-mist">
          Quantos episódios cabem até o fim das aulas? Isso muda o gancho do fim de cada episódio.
        </legend>
        {(['long', 'short'] as const).map((o) => (
          <label
            key={o}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-3 border-[3px] border-ink p-3',
              order === o ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
            )}
          >
            <input
              type="radio"
              name="season-order"
              checked={order === o}
              onChange={() => void choose(o)}
              className="mt-1 h-5 w-5 accent-[#7A0F18]"
            />
            <span>
              <strong className="font-heist text-xl tracking-wider">{SEASON_ORDER_LABEL[o]}</strong>
              <span className="block text-sm">
                {seasonEpisodes(o)
                  .map((e) => `${e.number}. ${e.title}`)
                  .join(' → ')}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="mt-2 font-bold text-alert">
          {error}
        </p>
      )}
    </ComicPanel>
  );
}

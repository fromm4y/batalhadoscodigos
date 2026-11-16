import { ComicButton, SpeechBubble, cn } from '@/components/comic';
import { CollectibleCard } from '@/components/game/CollectibleCard';
import { equippableCards } from '@/engine/cards';
import type { TeamCard } from '@/types/domain';
import { usesLabel } from './cardLabels';
import { useSeasonCards } from './useSeasonCards';

/**
 * Planejamento: a dupla escolhe UMA carta do Álbum para levar na missão (pedido da May, 16/11).
 * Só aparecem cartas de outros episódios. Dá para trocar até os cadeados começarem.
 */
export function CardPicker({
  cards,
  episodeId,
  equipped,
  onEquip,
  onNext,
}: {
  cards: TeamCard[] | undefined;
  episodeId: string;
  equipped: string | null | undefined;
  onEquip: (episodeId: string | null) => void;
  onNext: () => void;
}) {
  const info = useSeasonCards();
  const list = equippableCards(cards, episodeId);
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-center font-heist text-4xl tracking-[0.12em] text-brass text-glow-brass sm:text-5xl">
        🃏 CARTA DA MISSÃO
      </h1>
      <SpeechBubble who="narradora" tail="center" className="max-w-2xl">
        Escolham UMA carta do Álbum para levar. O poder dela vale durante o episódio de hoje!
      </SpeechBubble>
      <ul className="flex flex-wrap justify-center gap-4" aria-label="Cartas do Álbum">
        {info &&
          list.map((c) => {
            const meta = info[c.episodeId];
            if (!meta) return null;
            const chosen = equipped === c.episodeId;
            return (
              <li key={c.episodeId}>
                <button
                  type="button"
                  aria-pressed={chosen}
                  onClick={() => onEquip(chosen ? null : c.episodeId)}
                  className={cn(
                    'cursor-pointer rounded-xl p-1 transition-transform',
                    chosen ? 'scale-105 outline-4 outline-spotlight' : 'hover:-translate-y-1',
                  )}
                >
                  <CollectibleCard
                    card={meta.card}
                    number={meta.number}
                    slot={c.variant === 'dourada' ? 'dourada' : 'ganha'}
                    usesLabel={usesLabel(c)}
                  />
                  <span className="mt-1 block font-heist text-xl tracking-wider text-paper">
                    {chosen ? '✔ LEVANDO ESTA' : 'Levar esta'}
                  </span>
                </button>
              </li>
            );
          })}
      </ul>
      <ComicButton variant="red" size="lg" icon="⚡" onClick={onNext}>
        {equipped ? 'Escolher meu lado' : 'Seguir sem carta'}
      </ComicButton>
    </div>
  );
}

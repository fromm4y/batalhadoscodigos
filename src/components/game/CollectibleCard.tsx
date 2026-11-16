import { motion, useReducedMotion } from 'framer-motion';
import { ComicArt, cn } from '@/components/comic';
import type { EpisodeCard } from '@/content/types';
import type { AlbumSlot } from '@/engine/cards';
import { powerIcon } from '@/features/game/cardLabels';

/**
 * Figurinha do Álbum do Museu (pedido da May, 16/11): carta de colecionador com arte, ano e o
 * poder que vale nos outros episódios. Dourada = rara (venceu o confronto), com brilho
 * holográfico. Futura = trancada; perdida = a dupla faltou.
 */
export function CollectibleCard({
  card,
  number,
  slot,
  size = 'md',
  flip = false,
  usesLabel,
  className,
}: {
  card: EpisodeCard;
  number: number;
  slot: AlbumSlot;
  size?: 'sm' | 'md' | 'lg';
  /** anima a carta virando (ao ganhar) */
  flip?: boolean;
  /** ex.: "1 uso por episódio" */
  usesLabel?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const gold = slot === 'dourada';
  const owned = slot === 'ganha' || gold;
  const w = size === 'sm' ? 'w-36' : size === 'lg' ? 'w-64' : 'w-48';

  return (
    <motion.figure
      initial={flip ? (reduce ? { opacity: 0 } : { rotateY: 180, opacity: 0, scale: 0.7 }) : false}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ delay: flip ? 0.6 : 0, duration: 0.9, type: 'spring', damping: 15 }}
      aria-label={
        owned
          ? `Carta ${number}: ${card.title}${gold ? ', dourada (rara)' : ''}. Poder: ${card.power.name}`
          : slot === 'hoje'
            ? `Carta ${number}: em jogo hoje`
            : slot === 'futura'
              ? `Carta ${number}: trancada, próxima semana`
              : `Carta ${number}: perdida`
      }
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden rounded-lg border-4 p-1.5 shadow-[6px_6px_0_#000]',
        w,
        gold
          ? 'border-brass bg-[linear-gradient(135deg,#6b4b12,#d4a537_45%,#fff4c2_55%,#8a6418)] glow-brass'
          : owned
            ? 'border-ink bg-graphite-light'
            : 'border-ink bg-graphite',
        className,
      )}
    >
      {gold && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 animate-holo bg-[linear-gradient(110deg,transparent_20%,rgb(255_255_255/0.45)_30%,rgb(120_200_255/0.35)_38%,rgb(255_120_220/0.3)_46%,transparent_56%)] bg-[length:200%_100%] mix-blend-overlay"
        />
      )}
      <div className="relative aspect-[600/840] w-full overflow-hidden rounded-sm border-2 border-ink bg-night">
        {owned ? (
          <ComicArt id={card.art} alt="" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle,#252b3a,#0b0d14)] text-center">
            <span className="text-5xl opacity-70" aria-hidden>
              {slot === 'hoje' ? '🎯' : slot === 'futura' ? '🔒' : '🕳️'}
            </span>
          </div>
        )}
        <span className="absolute top-1 left-1 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-paper font-heist text-lg text-ink">
          {number}
        </span>
        {gold && (
          <span className="absolute top-1 right-1 border-2 border-ink bg-brass px-1.5 pt-0.5 font-heist text-sm tracking-wider text-ink">
            ★ RARA
          </span>
        )}
      </div>
      <figcaption className="relative z-20 mt-1.5 flex flex-col gap-1 text-center">
        {owned ? (
          <>
            <span
              className={cn(
                'font-heist leading-none tracking-wider',
                gold ? 'text-ink' : 'text-paper',
                size === 'sm' ? 'text-lg' : 'text-2xl',
              )}
            >
              {card.title}
            </span>
            <span className={cn('font-type text-xs', gold ? 'text-ink' : 'text-brass')}>
              {card.year} · Ep. {number}
            </span>
            {size !== 'sm' && (
              <span className="rounded-sm border-2 border-ink bg-paper px-1.5 py-1 text-left text-ink">
                <span className="block font-heist text-base leading-none tracking-wider">
                  {powerIcon(card.power.id)} {card.power.name}
                </span>
                <span className="block text-xs leading-snug font-semibold">{card.power.text}</span>
                {usesLabel && <span className="block font-type text-[11px]">{usesLabel}</span>}
              </span>
            )}
          </>
        ) : (
          <span className="font-type text-sm text-mist">
            {slot === 'hoje'
              ? 'EM JOGO HOJE!'
              : slot === 'futura'
                ? 'PRÓXIMA SEMANA'
                : 'Vocês não estavam lá...'}
          </span>
        )}
      </figcaption>
    </motion.figure>
  );
}

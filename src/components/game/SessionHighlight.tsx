import { motion, useReducedMotion } from 'framer-motion';
import { Avatar } from '@/components/avatar/Avatar';
import { cn } from '@/components/comic';
import { sessionHighlights } from '@/engine/ranking';
import type { TeamDoc } from '@/types/domain';

type Props = {
  teams: readonly (TeamDoc & { id: string })[];
  players: readonly { teamId: string; episodePoints: number }[];
  highlightId?: string;
  size?: 'md' | 'xl';
  className?: string;
};

/**
 * Destaque da aula: quem mais pontuou HOJE (pedido da May). Complementa o ranking da temporada,
 * para quem venceu a aula ter seu momento mesmo estando atrás no total.
 */
export function SessionHighlight({ teams, players, highlightId, size = 'md', className }: Props) {
  const reduce = useReducedMotion();
  const h = sessionHighlights(players);
  if (!h) return null;
  const xl = size === 'xl';
  const winners = h.teamIds
    .map((id) => teams.find((t) => t.id === id))
    .filter((t): t is TeamDoc & { id: string } => !!t);
  if (winners.length === 0) return null;
  const mine = !!highlightId && h.teamIds.includes(highlightId);

  return (
    <motion.section
      aria-label="Destaque da aula"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: -1 }}
      transition={{ delay: 2.4, type: 'spring', damping: 12 }}
      className={cn(
        'flex items-center gap-4 rounded-hand border-[3px] border-ink bg-graphite px-5 py-3 glow-brass',
        mine && 'outline-4 outline-spotlight',
        className,
      )}
    >
      <span className={xl ? 'text-6xl' : 'text-4xl'} aria-hidden>
        ⭐
      </span>
      <div className="flex -space-x-3">
        {winners.map((t) => (
          <Avatar
            key={t.id}
            avatar={t.avatar}
            className={xl ? 'h-24 w-20' : 'h-14 w-12'}
            decorative
          />
        ))}
      </div>
      <div>
        <p className={cn('font-type text-brass', xl ? 'text-2xl' : 'text-sm')}>
          {winners.length > 1 ? 'Destaques da aula' : 'Destaque da aula'}
        </p>
        <p
          className={cn(
            'font-heist leading-none tracking-wider text-paper text-glow-spot',
            xl ? 'text-6xl' : 'text-3xl',
          )}
        >
          {winners.map((t) => t.cityName).join(' & ')}
        </p>
        <p className={cn('font-heist tracking-wider text-success', xl ? 'text-4xl' : 'text-xl')}>
          +{h.points} pontos hoje{mine ? ' · são vocês! 🎉' : ''}
        </p>
      </div>
    </motion.section>
  );
}

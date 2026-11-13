import { motion, useReducedMotion } from 'framer-motion';
import { Avatar } from '@/components/avatar/Avatar';
import { cn } from '@/components/comic';
import { podiumOrder, rankTeams, type RankRow } from '@/engine/ranking';
import type { TeamDoc } from '@/types/domain';

type Team = TeamDoc & { id: string };

type Props = {
  teams: readonly Team[];
  /** dupla do aluno, destacada com brilho */
  highlightId?: string;
  /** `xl` = projetor (letras para o fundo da sala) */
  size?: 'md' | 'xl';
  /** quantas linhas mostrar abaixo do pódio (o resto vira "+N") */
  maxRest?: number;
  className?: string;
};

const PLACE = {
  1: { h: 'h-40', hXl: 'h-64', bg: 'bg-brass glow-brass', medal: '🥇' },
  2: { h: 'h-28', hXl: 'h-48', bg: 'bg-mist', medal: '🥈' },
  3: { h: 'h-20', hXl: 'h-36', bg: 'bg-[#b87333]', medal: '🥉' },
} as const;

/** Ranking da turma em pódio animado + lista (SPEC 9.2 e 9.4, RN-25). */
export function RankingPodium({ teams, highlightId, size = 'md', maxRest = 7, className }: Props) {
  const reduce = useReducedMotion();
  const rows = rankTeams(teams);
  const xl = size === 'xl';
  if (rows.length === 0)
    return (
      <p className={cn('font-type text-mist', xl ? 'text-3xl' : 'text-lg', className)}>
        O ranking aparece quando as duplas pontuarem.
      </p>
    );
  const podium = podiumOrder(rows.slice(0, 3));
  const rest = rows.slice(3);
  const shown = rest.slice(0, maxRest);

  return (
    <section aria-label="Ranking da turma" className={cn('flex flex-col gap-4', className)}>
      <ol className="flex items-end justify-center gap-3" aria-label="Pódio">
        {podium.map(({ item, place }, i) => {
          const p = PLACE[place];
          const me = item.team.id === highlightId;
          return (
            <motion.li
              key={item.team.id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              // O 3º sobe primeiro e o 1º por último, para criar suspense.
              transition={{
                delay: (3 - place) * 0.5 + 0.2 + i * 0.05,
                type: 'spring',
                damping: 14,
              }}
              className={cn('flex flex-col items-center', xl ? 'w-64' : 'w-36')}
            >
              <Avatar
                avatar={item.team.avatar}
                className={cn(
                  xl ? 'h-36 w-32' : 'h-20 w-16',
                  me && 'drop-shadow-[0_0_12px_#FFF4C2]',
                )}
                decorative
              />
              <span
                className={cn(
                  'max-w-full truncate text-center font-heist tracking-wider',
                  xl ? 'text-4xl' : 'text-xl',
                  me ? 'text-spotlight text-glow-spot' : 'text-paper',
                )}
              >
                {item.team.cityName}
              </span>
              <div
                className={cn(
                  'flex w-full flex-col items-center justify-start rounded-t-sm border-[3px] border-b-0 border-ink pt-2 text-ink',
                  xl ? p.hXl : p.h,
                  p.bg,
                )}
              >
                <span className={xl ? 'text-5xl' : 'text-2xl'} aria-hidden>
                  {p.medal}
                </span>
                <span className={cn('font-heist leading-none', xl ? 'text-6xl' : 'text-3xl')}>
                  {item.team.totalPoints}
                </span>
                <span className="sr-only">
                  {item.position}º lugar, {item.team.totalPoints} pontos
                </span>
                <span className={cn('font-type', xl ? 'text-xl' : 'text-xs')} aria-hidden>
                  pts
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {shown.length > 0 && (
        <ol
          start={4}
          className={cn('mx-auto grid w-full gap-1', xl ? 'max-w-4xl grid-cols-2 gap-x-8' : '')}
        >
          {shown.map((r, i) => (
            <RestRow key={r.team.id} row={r} xl={xl} me={r.team.id === highlightId} delay={i} />
          ))}
        </ol>
      )}
      {rest.length > shown.length && (
        <p className={cn('text-center font-type text-mist', xl ? 'text-2xl' : 'text-sm')}>
          +{rest.length - shown.length} dupla(s)
        </p>
      )}
    </section>
  );
}

function RestRow({
  row,
  xl,
  me,
  delay,
}: {
  row: RankRow<Team>;
  xl: boolean;
  me: boolean;
  delay: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.8 + delay * 0.08 }}
      className={cn(
        'flex items-center gap-3 border-b border-graphite-light py-1',
        me && 'bg-spotlight/10 outline-2 outline-spotlight',
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-full border-2 border-ink bg-graphite-light font-heist text-paper',
          xl ? 'h-12 w-12 text-3xl' : 'h-8 w-8 text-lg',
        )}
      >
        {row.position}
      </span>
      <Avatar avatar={row.team.avatar} className={xl ? 'h-12 w-10' : 'h-8 w-7'} decorative />
      <span className={cn('flex-1 truncate font-bold text-paper', xl ? 'text-3xl' : 'text-base')}>
        {row.team.cityName}
      </span>
      <span className={cn('font-heist tracking-wider text-brass', xl ? 'text-4xl' : 'text-2xl')}>
        {row.team.totalPoints}
      </span>
    </motion.li>
  );
}

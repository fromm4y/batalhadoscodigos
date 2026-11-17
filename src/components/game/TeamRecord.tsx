import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/components/comic';
import { BADGES, badgeCounts, teamLevel } from '@/engine/badges';
import { SEASON } from '@/content/season';
import type { Badge, Side, Stamp } from '@/types/domain';

const RESULT: Record<Stamp['result'], { icon: string; label: string }> = {
  venceu: { icon: '🏆', label: 'venceu' },
  empate: { icon: '🤝', label: 'empatou' },
  perdeu: { icon: '💪', label: 'perdeu, mas lutou' },
  jogou: { icon: '✔', label: 'jogou' },
};

/** Nível da dupla (SPEC-02 D1): "Recruta" no Bando, "Grumete" nos Piratas... */
export function LevelTag({ played, side }: { played: number; side: Side }) {
  return (
    <span
      className={cn(
        'inline-block border-2 border-ink px-2 pt-0.5 font-heist text-lg tracking-wider',
        side === 'red' ? 'bg-bando text-paper' : 'bg-piratas text-paper',
      )}
      title={`${played} episódio(s) jogado(s)`}
    >
      {side === 'red' ? '🎭' : '⚓'} {teamLevel(played, side)}
    </span>
  );
}

/** Carimbos da ficha: um por episódio jogado, com o lado e o resultado. */
export function StampRow({
  stamps,
  size = 'md',
}: {
  stamps: Stamp[] | undefined;
  size?: 'sm' | 'md';
}) {
  const list = [...(stamps ?? [])].sort(
    (a, b) =>
      (SEASON.find((e) => e.id === a.episodeId)?.number ?? 0) -
      (SEASON.find((e) => e.id === b.episodeId)?.number ?? 0),
  );
  if (!list.length) return null;
  const sm = size === 'sm';
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Carimbos dos episódios">
      {list.map((s) => {
        const ep = SEASON.find((e) => e.id === s.episodeId);
        return (
          <li
            key={s.episodeId}
            title={`Ep. ${ep?.number} · ${ep?.title}: ${s.side === 'red' ? 'Bando' : 'Piratas'}, ${RESULT[s.result].label}`}
            aria-label={`Episódio ${ep?.number}: ${s.side === 'red' ? 'Bando' : 'Piratas'}, ${RESULT[s.result].label}`}
            className={cn(
              'grid -rotate-6 place-items-center rounded-full border-[3px] border-dashed font-heist leading-none',
              sm ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm',
              s.side === 'red' ? 'border-bando text-bando' : 'border-piratas text-piratas',
            )}
          >
            <span>EP {ep?.number}</span>
            <span aria-hidden>{RESULT[s.result].icon}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Selos (SPEC-02 D2), com a contagem quando repete (⚡×2). */
export function BadgeRow({
  badges,
  size = 'md',
  onDark = false,
}: {
  badges: Badge[] | undefined;
  size?: 'sm' | 'md';
  onDark?: boolean;
}) {
  const counts = badgeCounts(badges);
  if (!counts.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Selos">
      {counts.map(([id, n]) => (
        <li
          key={id}
          title={`${BADGES[id].name}: ${BADGES[id].text}`}
          className={cn(
            'flex items-center gap-1 rounded-full border-2 px-2',
            size === 'sm' ? 'text-sm' : 'py-0.5 text-base',
            onDark ? 'border-brass/70 bg-night text-paper' : 'border-ink bg-paper text-ink',
          )}
        >
          <span aria-hidden>{BADGES[id].icon}</span>
          <span className={size === 'sm' ? 'sr-only' : 'font-bold'}>{BADGES[id].name}</span>
          {n > 1 && <span className="font-heist">×{n}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Selos ganhos AGORA, no fim do episódio: estouram um por um (D2: "animação"). */
export function NewBadges({
  badges,
  episodeId,
}: {
  badges: Badge[] | undefined;
  episodeId: string;
}) {
  const reduce = useReducedMotion();
  const fresh = (badges ?? []).filter((b) => b.episodeId === episodeId);
  if (!fresh.length) return null;
  return (
    <section aria-label="Selos novos" className="flex flex-col gap-2">
      <p className="font-comic text-xl tracking-wide text-brass text-outline">SELOS NOVOS!</p>
      <ul className="flex flex-wrap gap-2">
        {fresh.map((b, i) => (
          <motion.li
            key={b.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.3, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.8 + i * 0.35, type: 'spring', damping: 11 }}
            title={BADGES[b.id].text}
            aria-label={`${BADGES[b.id].name}: ${BADGES[b.id].text}`}
            className="flex items-center gap-1.5 rounded-full border-[3px] border-brass bg-night px-3 py-0.5 text-paper glow-brass"
          >
            <span className="text-2xl" aria-hidden>
              {BADGES[b.id].icon}
            </span>
            <span className="font-heist text-lg leading-none tracking-wider text-brass" aria-hidden>
              {BADGES[b.id].name}
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

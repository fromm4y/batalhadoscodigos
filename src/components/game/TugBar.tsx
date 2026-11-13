import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';

type Props = {
  /** −100 (Bando vence) a +100 (Piratas vencem) */
  bar: number;
  redName: string;
  blueName: string;
  /** Disfarce: esta dupla não vê a barra */
  hidden?: boolean;
  compact?: boolean;
};

/** Cabo de guerra (SPEC 9.2 / VISUAL 8.6): corda com nó brilhante, mola e faíscas a cada puxão. */
export function TugBar({ bar, redName, blueName, hidden = false, compact = false }: Props) {
  const reduce = useReducedMotion();
  const shake = useAnimationControls();
  const prev = useRef(bar);
  const pct = ((bar - GAME_RULES.bar.min) / (GAME_RULES.bar.max - GAME_RULES.bar.min)) * 100;
  const lim = GAME_RULES.bar.preVaultLimit;
  const limPct = (lim / (GAME_RULES.bar.max - GAME_RULES.bar.min)) * 100;

  useEffect(() => {
    if (prev.current !== bar && !reduce)
      void shake.start({ x: [0, -4, 4, -2, 0], transition: { duration: 0.35 } });
    prev.current = bar;
  }, [bar, reduce, shake]);

  const status =
    bar < 0 ? `${redName} está ganhando` : bar > 0 ? `${blueName} está ganhando` : 'Empatado';

  return (
    <motion.div
      animate={shake}
      className={cn('flex w-full items-center gap-3', compact ? 'h-8' : 'h-12')}
      role="meter"
      aria-label="Cabo de guerra"
      aria-valuemin={GAME_RULES.bar.min}
      aria-valuemax={GAME_RULES.bar.max}
      aria-valuenow={hidden ? undefined : bar}
      aria-valuetext={hidden ? 'Barra escondida pelo Disfarce' : status}
    >
      <span
        className={cn(
          'shrink-0 truncate font-heist tracking-wider text-bando text-glow-red',
          compact ? 'max-w-24 text-lg' : 'max-w-40 text-2xl',
        )}
      >
        🎭 {redName}
      </span>
      <div
        className={cn(
          'relative flex-1 overflow-hidden rounded-full border-[3px] border-ink',
          compact ? 'h-5' : 'h-7',
        )}
      >
        <div className="absolute inset-y-0 left-0 w-1/2 bg-bando-dark" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-piratas-dark" />
        {/* zona travada antes do Cofre (RN-17) */}
        <div
          className="absolute inset-y-0 border-x-2 border-dashed border-paper/30"
          style={{ left: `${50 - limPct}%`, right: `${50 - limPct}%` }}
        />
        {/* corda */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#d8c79e_0_6px,#a8834a_6px_9px)]" />
        {hidden ? (
          <div className="absolute inset-0 grid place-items-center bg-graphite-light font-heist text-lg tracking-widest text-paper">
            🥸 DISFARÇADO ???
          </div>
        ) : (
          <motion.div
            className={cn(
              'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-ink bg-brass glow-brass',
              compact ? 'h-6 w-6' : 'h-9 w-9',
            )}
            animate={{ left: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 12 }}
          >
            <span aria-hidden className="grid h-full place-items-center text-xs">
              ✦
            </span>
          </motion.div>
        )}
      </div>
      <span
        className={cn(
          'shrink-0 truncate text-right font-heist tracking-wider text-piratas text-glow-blue',
          compact ? 'max-w-24 text-lg' : 'max-w-40 text-2xl',
        )}
      >
        {blueName} ⚓
      </span>
    </motion.div>
  );
}

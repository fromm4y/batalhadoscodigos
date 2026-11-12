import { motion, useAnimationControls } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import { cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';

const LEN = GAME_RULES.team.pinLength;

type PinPadProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  /** Muda para fazer as bolinhas tremerem (erro). */
  shakeKey?: number;
  label: string;
};

/** Teclado numérico grande (SPEC 9.2, item 2). Também aceita o teclado do computador. */
export function PinPad({ value, onChange, onSubmit, disabled, shakeKey = 0, label }: PinPadProps) {
  const controls = useAnimationControls();

  useEffect(() => {
    if (shakeKey > 0)
      void controls.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.45 } });
  }, [shakeKey, controls]);

  const press = useCallback(
    (d: string) => {
      if (disabled) return;
      if (d === '⌫') onChange(value.slice(0, -1));
      else if (value.length < LEN) onChange(value + d);
    },
    [disabled, onChange, value],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter' && value.length === LEN) onSubmit?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, onSubmit, value.length]);

  return (
    <div className="flex flex-col items-center gap-5">
      <motion.div
        animate={controls}
        className="flex gap-4"
        role="status"
        aria-live="polite"
        aria-label={`${label}: ${value.length} de ${LEN} números`}
      >
        {Array.from({ length: LEN }, (_, i) => (
          <span
            key={i}
            className={cn(
              'grid h-16 w-16 place-items-center rounded-full border-4 border-ink text-4xl transition-colors',
              i < value.length ? 'bg-brass glow-brass' : 'bg-graphite-light',
            )}
          >
            {i < value.length ? '●' : ''}
          </span>
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-3" role="group" aria-label={label}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) =>
          d === '' ? (
            <span key={i} />
          ) : (
            <motion.button
              key={d}
              type="button"
              whileTap={{ scale: 0.92, y: 3 }}
              disabled={disabled}
              onClick={() => press(d)}
              aria-label={d === '⌫' ? 'Apagar' : d}
              className="h-16 w-20 cursor-pointer rounded-hand border-4 border-ink bg-aged font-heist text-4xl text-ink shadow-comic-sm hover:bg-paper disabled:opacity-50"
            >
              {d}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}

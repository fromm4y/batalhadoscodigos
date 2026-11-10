import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from './cn';
import { ONOMATOPOEIA, type OnomatopoeiaKind } from './onomatopoeiaStyles';

/** Gera os pontos de uma explosão em estrela com pontas irregulares (determinístico por seed). */
function burstPoints(spikes: number, seed: number): string {
  const pts: string[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI * i) / spikes;
    const r = i % 2 === 0 ? 47 - rand() * 6 : 28 + rand() * 7;
    pts.push(`${(50 + r * Math.cos(angle)).toFixed(1)},${(50 + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

type OnomatopoeiaProps = {
  kind: OnomatopoeiaKind;
  /** Texto próprio quando kind = "custom". */
  text?: string;
  /** Mude este valor para disparar a animação de novo. */
  playKey?: number | string;
  size?: number;
  /** Rotação base em graus. */
  rotate?: number;
  className?: string;
};

/** Onomatopeia de HQ estourando numa explosão em estrela. */
export function Onomatopoeia({
  kind,
  text,
  playKey = 0,
  size = 220,
  rotate = -8,
  className,
}: OnomatopoeiaProps) {
  const style =
    kind === 'custom'
      ? { text: text ?? 'POW!', burst: '#F4C430', textColor: '#E63946' }
      : ONOMATOPOEIA[kind];
  const points = useMemo(() => burstPoints(13, style.text.length * 31 + 7), [style.text]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={`${kind}-${playKey}`}
        role="img"
        aria-label={style.text}
        initial={{ scale: 0, rotate: rotate - 40, opacity: 0 }}
        animate={{ scale: [0, 1.25, 0.95, 1], rotate, opacity: 1 }}
        exit={{ scale: 0.4, opacity: 0 }}
        transition={{ duration: 0.55, times: [0, 0.5, 0.75, 1], ease: 'easeOut' }}
        className={cn('relative inline-grid place-items-center select-none', className)}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full drop-shadow-[5px_5px_0_#111]"
        >
          <polygon
            points={points}
            fill={style.burst}
            stroke="#111"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points={points}
            fill="url(#halftone-dots)"
            opacity="0.35"
            transform="translate(50 50) scale(0.82) translate(-50 -50)"
          />
          <defs>
            <pattern id="halftone-dots" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.9" fill="#fff" />
            </pattern>
          </defs>
        </svg>
        <motion.span
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.6 }}
          className="relative font-comic leading-none tracking-wider text-outline-thick"
          style={{ color: style.textColor, fontSize: size * 0.24 }}
        >
          {style.text}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type PanelTone = 'graphite' | 'paper' | 'red' | 'blue' | 'blueprint' | 'nautical' | 'night';

const toneClass: Record<PanelTone, string> = {
  graphite: 'bg-graphite-dots text-paper',
  paper: 'bg-aged text-ink',
  red: 'bg-halftone-red text-paper',
  blue: 'bg-halftone-blue text-paper',
  blueprint: 'bg-blueprint text-paper',
  nautical: 'bg-nautical text-ink',
  night: 'bg-noir text-paper',
};

export type PanelGlow = 'red' | 'blue' | 'brass' | 'none';
const glowClass: Record<PanelGlow, string> = {
  red: 'glow-red',
  blue: 'glow-blue',
  brass: 'glow-brass',
  none: '',
};

type ComicPanelProps = {
  children: ReactNode;
  /** Recordatório no canto (estilo legenda de HQ). */
  caption?: string;
  tone?: PanelTone;
  glow?: PanelGlow;
  /** Rotação leve em graus (de −1 a 1). */
  tilt?: number;
  delay?: number;
  className?: string;
  as?: 'section' | 'div' | 'article';
  /** Sem padding interno (arte encostando na borda). */
  flush?: boolean;
};

/**
 * Quadro de HQ noir: borda preta grossa, cantos irregulares, aro grafite e sombra chapada.
 * Entra como página de HQ (slide + leve rotação).
 */
export function ComicPanel({
  children,
  caption,
  tone = 'graphite',
  glow = 'none',
  tilt = 0,
  delay = 0,
  className,
  as = 'section',
  flush = false,
}: ComicPanelProps) {
  const MotionTag = motion[as];
  const safeTilt = Math.max(-1, Math.min(1, tilt));
  return (
    <MotionTag
      initial={{ opacity: 0, x: 60, rotate: safeTilt + 4 }}
      animate={{ opacity: 1, x: 0, rotate: safeTilt }}
      transition={{ type: 'spring', stiffness: 220, damping: 22, delay }}
      className={cn(
        'relative rounded-hand border-4 border-ink outline-2 outline-graphite-light shadow-comic',
        flush ? 'overflow-hidden p-0' : 'p-5',
        toneClass[tone],
        glowClass[glow],
        className,
      )}
    >
      {caption && (
        <p
          className={cn(
            'absolute left-4 z-10 -rotate-1 border-[3px] border-ink bg-paper px-3 py-1 font-type text-sm uppercase tracking-wide text-ink shadow-comic-sm',
            flush ? 'top-3' : '-top-4',
          )}
        >
          {caption}
        </p>
      )}
      {children}
    </MotionTag>
  );
}

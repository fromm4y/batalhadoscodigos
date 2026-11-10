import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type PanelTone = 'paper' | 'red' | 'blue' | 'gold' | 'ink' | 'halftone';

const toneClass: Record<PanelTone, string> = {
  paper: 'bg-paper text-ink',
  halftone: 'bg-halftone text-ink',
  red: 'bg-halftone-red text-white',
  blue: 'bg-halftone-blue text-white',
  gold: 'bg-halftone-gold text-ink',
  ink: 'bg-ink text-paper',
};

type ComicPanelProps = {
  children: ReactNode;
  /** Legenda amarela no canto, estilo recordatório de HQ. */
  caption?: string;
  tone?: PanelTone;
  /** Rotação leve em graus (SPEC 9.6: de −1 a 1). */
  tilt?: number;
  /** Atraso da animação de entrada, em segundos. */
  delay?: number;
  className?: string;
  as?: 'section' | 'div' | 'article';
};

/** Quadro de HQ: borda grossa, cantos irregulares, sombra chapada e entrada com "pop". */
export function ComicPanel({
  children,
  caption,
  tone = 'paper',
  tilt = 0,
  delay = 0,
  className,
  as = 'section',
}: ComicPanelProps) {
  const MotionTag = motion[as];
  const safeTilt = Math.max(-1, Math.min(1, tilt));
  return (
    <MotionTag
      initial={{ opacity: 0, scale: 0.85, rotate: safeTilt - 3 }}
      animate={{ opacity: 1, scale: 1, rotate: safeTilt }}
      transition={{ type: 'spring', stiffness: 320, damping: 18, delay }}
      className={cn(
        'relative border-4 border-ink rounded-hand shadow-comic p-5',
        toneClass[tone],
        className,
      )}
    >
      {caption && (
        <p className="absolute -top-4 left-4 z-10 -rotate-1 border-[3px] border-ink bg-gold px-3 py-1 font-body text-sm font-extrabold uppercase tracking-wide text-ink shadow-comic-sm">
          {caption}
        </p>
      )}
      {children}
    </MotionTag>
  );
}

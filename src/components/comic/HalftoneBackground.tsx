import type { ReactNode } from 'react';
import { cn } from './cn';

type HalftoneBackgroundProps = {
  children: ReactNode;
  tone?: 'paper' | 'red' | 'blue' | 'gold';
  /** Raios de ação por cima da retícula (telas de impacto). */
  rays?: boolean;
  className?: string;
};

const toneClass = {
  paper: 'bg-halftone',
  red: 'bg-halftone-red',
  blue: 'bg-halftone-blue',
  gold: 'bg-halftone-gold',
} as const;

/** Fundo de página de HQ com retícula (halftone). */
export function HalftoneBackground({
  children,
  tone = 'paper',
  rays,
  className,
}: HalftoneBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-x-hidden', toneClass[tone], className)}>
      {rays && <div aria-hidden className="pointer-events-none absolute inset-0 bg-action-rays" />}
      <div className="relative">{children}</div>
    </div>
  );
}

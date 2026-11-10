import type { ReactNode } from 'react';
import { cn } from './cn';

type HalftoneBackgroundProps = {
  children: ReactNode;
  tone?: 'night' | 'red' | 'blue' | 'blueprint';
  /** Escurece as bordas da tela. */
  vignette?: boolean;
  className?: string;
};

const toneClass = {
  night: 'bg-noir',
  red: 'bg-halftone-red',
  blue: 'bg-halftone-blue',
  blueprint: 'bg-blueprint',
} as const;

/** Fundo de página noir: retícula escura + vinheta. */
export function HalftoneBackground({
  children,
  tone = 'night',
  vignette = true,
  className,
}: HalftoneBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', toneClass[tone], className)}>
      {vignette && <div aria-hidden className="vignette pointer-events-none fixed inset-0 z-0" />}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

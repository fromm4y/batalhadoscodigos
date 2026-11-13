import type { ReactNode } from 'react';
import { cn } from '@/components/comic';

/** Moldura de vitrine com cantos de latão brilhando (invenções, Cofre, cartas). */
export function BrassFrame({
  children,
  className,
  tight = false,
}: {
  children: ReactNode;
  className?: string;
  /** moldura fina (tela de jogo, onde cada pixel de altura conta) */
  tight?: boolean;
}) {
  const corner = 'absolute h-7 w-7 border-brass';
  return (
    <div
      className={cn(
        'relative border-2 border-brass/40 bg-[linear-gradient(160deg,rgb(255_244_194/0.07),transparent_40%)] glow-brass',
        tight ? 'p-1.5' : 'p-4',
        className,
      )}
    >
      <span aria-hidden className={cn(corner, '-top-1 -left-1 border-t-4 border-l-4')} />
      <span aria-hidden className={cn(corner, '-top-1 -right-1 border-t-4 border-r-4')} />
      <span aria-hidden className={cn(corner, '-bottom-1 -left-1 border-b-4 border-l-4')} />
      <span aria-hidden className={cn(corner, '-right-1 -bottom-1 border-r-4 border-b-4')} />
      {children}
    </div>
  );
}

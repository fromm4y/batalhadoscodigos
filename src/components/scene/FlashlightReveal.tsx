import { useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';
import { cn } from '@/components/comic';

/**
 * Lanterna: a cena fica no escuro e um círculo de luz segue o mouse (VISUAL.md §6).
 * Com movimento reduzido, a cena aparece inteira, sem lanterna.
 */
export function FlashlightReveal({
  children,
  radius = 190,
  className,
}: {
  children: ReactNode;
  radius?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const maskRef = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    maskRef.current?.style.setProperty('--fx', `${e.clientX - rect.left}px`);
    maskRef.current?.style.setProperty('--fy', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onPointerMove={reduce ? undefined : move}
    >
      {children}
      {!reduce && (
        <div
          ref={maskRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={
            {
              '--fx': '50%',
              '--fy': '45%',
              background: `radial-gradient(circle ${radius}px at var(--fx) var(--fy), rgb(255 244 194 / 0.08) 0%, transparent 55%, rgb(5 6 10 / 0.96) 100%)`,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
}

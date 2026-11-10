import { useMemo } from 'react';

/** Partículas de poeira flutuando na luz (poucas e leves). */
export function Dust({ count = 18 }: { count?: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 53) % 100,
        top: 30 + ((i * 37) % 70),
        size: 1 + (i % 3),
        delay: (i * 1.7) % 14,
        duration: 10 + (i % 6) * 2,
      })),
    [count],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m, i) => (
        <span
          key={i}
          className="absolute animate-dust rounded-full bg-spotlight"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: m.size * 2,
            height: m.size * 2,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
            boxShadow: '0 0 6px rgb(255 244 194 / 0.8)',
          }}
        />
      ))}
    </div>
  );
}

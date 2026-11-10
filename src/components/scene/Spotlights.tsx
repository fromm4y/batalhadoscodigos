import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/components/comic';

type Beam = { x: string; angle: number; sweep: number; duration: number; color?: string };

const DEFAULT_BEAMS: Beam[] = [
  { x: '18%', angle: 18, sweep: 22, duration: 9 },
  { x: '82%', angle: -18, sweep: 22, duration: 11 },
];

/** Cones de luz de holofote varrendo devagar a cena (VISUAL.md §4). */
export function Spotlights({
  beams = DEFAULT_BEAMS,
  className,
  intensity = 0.16,
}: {
  beams?: Beam[];
  className?: string;
  intensity?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {beams.map((b, i) => (
        <motion.div
          key={i}
          className="absolute -top-10 h-[140%] w-[34rem] origin-top"
          style={{
            left: b.x,
            marginLeft: '-17rem',
            background: `conic-gradient(from 0deg at 50% 0%, transparent 162deg, ${b.color ?? `rgb(255 244 194 / ${intensity})`} 172deg, ${b.color ?? `rgb(255 244 194 / ${intensity})`} 188deg, transparent 198deg)`,
            filter: 'blur(6px)',
          }}
          initial={{ rotate: b.angle }}
          animate={reduce ? { rotate: b.angle } : { rotate: [b.angle, b.angle - b.sweep, b.angle] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

/** Pseudoaleatório determinístico: render puro e o mesmo desenho a cada render. */
function makePieces(count: number, seed: number) {
  let x = seed * 9301 + 49297;
  const rnd = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: rnd() * 100,
    delay: rnd() * 1.2,
    dur: 2.4 + rnd() * 1.8,
    rot: rnd() * 720 - 360,
    w: 6 + rnd() * 8,
    color: COLORS[i % COLORS.length]!,
  }));
}

const COLORS = ['#D4A537', '#E63946', '#2F6BFF', '#FFF4C2', '#2BB673'];

/** Chuva de papel picado (vitória). Sem animação quando o usuário pede menos movimento. */
export function Confetti({ count = 60, seed = 1 }: { count?: number; seed?: number }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => makePieces(count, seed), [count, seed]);
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{ left: `${p.left}%`, width: p.w, height: p.w * 0.5, background: p.color }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', rotate: p.rot, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

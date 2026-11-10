import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/components/comic';

/** Cartaz de Procurado (Piratas). A recompensa é o mesmo número dos pontos (RN-26). */
export function WantedPoster({
  children,
  name,
  reward,
  rotate = 0,
  delay = 0,
  size = 'md',
  className,
}: {
  children: ReactNode;
  name: string;
  reward: number;
  rotate?: number;
  delay?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const sm = size === 'sm';
  return (
    <motion.figure
      initial={{ opacity: 0, y: -30, rotate: rotate + 8 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
      className={cn(
        'relative flex flex-col items-center border-[3px] border-[#5b4321] bg-nautical text-ink shadow-[5px_6px_0_#000]',
        sm ? 'w-[7.6rem] p-1.5' : 'w-64 p-4',
        className,
      )}
    >
      <p
        className={cn(
          'font-heist leading-none',
          sm ? 'text-[1.35rem] tracking-[0.06em]' : 'text-5xl tracking-[0.15em]',
        )}
      >
        PROCURADA
      </p>
      {!sm && <p className="font-type text-xs">— VIVA E DE BOM HUMOR —</p>}
      <div
        className={cn(
          'my-1.5 w-full overflow-hidden border-[3px] border-[#5b4321] bg-[#c9b48a]',
          sm ? 'aspect-square' : 'aspect-[4/3.6]',
        )}
      >
        {children}
      </div>
      <p
        className={cn(
          'text-center font-heist leading-tight tracking-wider',
          sm ? 'text-base' : 'text-3xl',
        )}
      >
        {name}
      </p>
      <p
        className={cn('font-type whitespace-nowrap text-[#7a5a1e]', sm ? 'text-[11px]' : 'text-lg')}
      >
        Recompensa:{' '}
        <strong className="font-heist text-[1.4em] tracking-wider text-ink">{reward}</strong> 🪙
      </p>
    </motion.figure>
  );
}

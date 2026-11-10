import { motion } from 'framer-motion';
import { cn } from './cn';

/** Logo tipográfico noir. Arte 100% original. */
export function GameLogo({ className, size = 'lg' }: { className?: string; size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <motion.h1
      initial={{ scale: 0.8, opacity: 0, filter: 'brightness(0)' }}
      animate={{ scale: 1, opacity: 1, filter: 'brightness(1)' }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className={cn(
        'inline-flex -rotate-2 flex-col items-center leading-[0.85] select-none',
        className,
      )}
    >
      <span
        className={cn(
          'border-2 border-paper/70 px-3 pt-1 font-type tracking-[0.35em] text-paper',
          big ? 'text-2xl' : 'text-base',
        )}
      >
        A GRANDE
      </span>
      <span
        className={cn(
          'font-comic tracking-wide text-bando text-outline-thick text-glow-red',
          big ? 'text-[8rem]' : 'text-6xl',
        )}
      >
        CAÇADA
      </span>
      <span
        className={cn(
          'font-heist tracking-[0.12em] text-brass text-glow-brass',
          big ? '-mt-1 text-6xl' : 'text-3xl',
        )}
      >
        AOS CÓDIGOS
      </span>
    </motion.h1>
  );
}

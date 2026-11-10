import { motion } from 'framer-motion';
import { cn } from './cn';

/** Logo tipográfico do jogo, estilo capa de gibi. Arte 100% original. */
export function GameLogo({ className, size = 'lg' }: { className?: string; size?: 'md' | 'lg' }) {
  const big = size === 'lg';
  return (
    <motion.h1
      initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
      animate={{ scale: 1, rotate: -2, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      className={cn('inline-flex flex-col items-center leading-[0.85] select-none', className)}
    >
      <span
        className={cn(
          'border-4 border-ink bg-ink px-4 py-1 font-comic tracking-[0.2em] text-gold shadow-comic',
          big ? 'text-3xl' : 'text-xl',
        )}
      >
        A GRANDE
      </span>
      <span
        className={cn(
          'font-comic tracking-wide text-bando text-outline-thick drop-shadow-[6px_6px_0_#111]',
          big ? 'text-[7.5rem]' : 'text-6xl',
        )}
      >
        CAÇADA
      </span>
      <span
        className={cn(
          'font-comic tracking-wide text-piratas text-outline-thick drop-shadow-[6px_6px_0_#111]',
          big ? '-mt-2 text-6xl' : 'text-4xl',
        )}
      >
        AOS <span className="text-gold">CÓDIGOS</span>
      </span>
    </motion.h1>
  );
}

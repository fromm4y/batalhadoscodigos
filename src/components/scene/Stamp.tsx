import { motion } from 'framer-motion';
import { cn } from '@/components/comic';

/** Carimbo girado (CONFIDENCIAL, PRÓXIMA SEMANA...). Bate com "pancada". */
export function Stamp({
  text,
  color = 'red',
  rotate = -12,
  delay = 0.4,
  className,
  onDark = false,
}: {
  text: string;
  color?: 'red' | 'blue' | 'brass';
  rotate?: number;
  delay?: number;
  className?: string;
  /** sobre fundo escuro: sem `multiply` (que apagaria a tinta), com fundo noturno */
  onDark?: boolean;
}) {
  const c = {
    red: 'text-bando border-bando',
    blue: 'text-piratas border-piratas',
    brass: 'text-brass border-brass',
  }[color];
  return (
    <motion.span
      initial={{ scale: 2.4, opacity: 0, rotate: rotate - 8 }}
      animate={{ scale: 1, opacity: 0.88, rotate }}
      transition={{ type: 'spring', stiffness: 600, damping: 18, delay }}
      className={cn(
        'pointer-events-none inline-block rounded-sm border-4 border-double px-3 pt-1 font-heist text-3xl tracking-[0.18em] select-none',
        onDark ? 'bg-night/85 glow-brass' : 'mix-blend-multiply',
        c,
        className,
      )}
    >
      {text}
    </motion.span>
  );
}

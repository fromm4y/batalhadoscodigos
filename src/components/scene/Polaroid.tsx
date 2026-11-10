import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/components/comic';
import { Tape } from './Tape';

/** Polaroide presa com fita (mural do Bando). */
export function Polaroid({
  children,
  caption,
  rotate = 0,
  delay = 0,
  className,
}: {
  children: ReactNode;
  caption: string;
  rotate?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: -30, rotate: rotate - 10 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
      className={cn('relative w-32 bg-[#F4EFE4] p-2 pb-1 shadow-[4px_6px_0_#000]', className)}
    >
      <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />
      <div className="aspect-square overflow-hidden bg-graphite">{children}</div>
      <figcaption className="py-1 text-center font-type text-sm text-ink">{caption}</figcaption>
    </motion.figure>
  );
}

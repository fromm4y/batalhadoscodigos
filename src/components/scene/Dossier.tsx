import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/components/comic';
import { Stamp } from './Stamp';

/** Documento confidencial: pasta parda, folha envelhecida, clipe e carimbo. */
export function Dossier({
  title,
  children,
  stamp = 'CONFIDENCIAL',
  rotate = -1,
  delay = 0,
  className,
}: {
  title: string;
  children: ReactNode;
  stamp?: string | null;
  rotate?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotate: rotate - 4 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay }}
      className={cn('relative pt-5', className)}
    >
      {/* aba da pasta */}
      <span
        aria-hidden
        className="absolute top-0 left-6 h-7 w-36 rounded-t-md border-[3px] border-b-0 border-ink bg-[#a8834a]"
      />
      <div className="relative rounded-sm border-[3px] border-ink bg-[#a8834a] p-3 shadow-comic">
        <div className="relative bg-aged p-6 pb-14 text-ink shadow-[inset_0_0_30px_rgb(120_90_40/0.25)]">
          {/* clipe */}
          <svg aria-hidden viewBox="0 0 24 60" className="absolute -top-6 right-10 h-16 w-6">
            <path
              d="M8 56 V10 a5 5 0 0 1 10 0 V48 a3 3 0 0 1 -6 0 V16"
              fill="none"
              stroke="#9aa3b8"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <h3 className="mb-3 border-b-2 border-dashed border-ink/50 pb-1 font-type text-xl uppercase tracking-wider">
            {title}
          </h3>
          <div className="font-body text-base font-semibold leading-relaxed">{children}</div>
          {stamp && (
            <Stamp text={stamp} className="absolute right-5 bottom-3" delay={delay + 0.5} />
          )}
        </div>
      </div>
    </motion.article>
  );
}

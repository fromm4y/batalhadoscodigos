import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type Speaker = 'professor' | 'capita' | 'narradora' | 'robo';

const speakerInfo: Record<Speaker, { name: string; tag: string }> = {
  professor: { name: 'O Professor', tag: 'bg-bando text-white' },
  capita: { name: 'A Capitã', tag: 'bg-piratas text-white' },
  narradora: { name: 'A Narradora', tag: 'bg-gold text-ink' },
  robo: { name: 'Robô', tag: 'bg-ink text-paper' },
};

const SHOUT_POINTS =
  '0,10 7,0 15,9 25,1 35,8 46,0 56,9 67,1 78,8 89,0 100,11 96,32 100,52 95,74 100,92 89,100 77,92 63,100 49,92 35,100 21,93 8,100 0,90 4,70 0,50 5,30';

type TailSide = 'left' | 'right' | 'center';

type SpeechBubbleProps = {
  children: ReactNode;
  who?: Speaker;
  /** Onde fica o rabicho (aponta para baixo). */
  tail?: TailSide;
  /** Balão de grito: borda serrilhada e texto em Bangers. */
  shout?: boolean;
  delay?: number;
  className?: string;
};

const tailPosition: Record<TailSide, string> = {
  left: 'left-8',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-8 -scale-x-100',
};

/** Balão de fala de HQ com rabicho. Usado por todos os personagens (SPEC 9.6). */
export function SpeechBubble({
  children,
  who,
  tail = 'left',
  shout = false,
  delay = 0,
  className,
}: SpeechBubbleProps) {
  const info = who ? speakerInfo[who] : null;
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.4, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay }}
      style={{ transformOrigin: tail === 'right' ? '85% 100%' : '15% 100%' }}
      className={cn('relative mb-9 inline-block max-w-md', className)}
    >
      {info && (
        <figcaption
          className={cn(
            'absolute -top-4 left-5 z-10 rotate-[-2deg] border-[3px] border-ink px-2 py-0.5 font-comic text-lg tracking-wider shadow-comic-sm',
            info.tag,
          )}
        >
          {info.name}
        </figcaption>
      )}
      {shout && (
        // Balão de grito: forma serrilhada em SVG (borda + sombra chapada de verdade).
        <svg
          aria-hidden
          className="absolute inset-0 z-[1] h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points={SHOUT_POINTS} fill="#111" transform="translate(1.6 4)" />
          <polygon
            points={SHOUT_POINTS}
            fill="white"
            stroke="#111"
            strokeWidth="4"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <blockquote
        className={cn(
          'relative z-[1]',
          shout
            ? 'px-10 py-6 font-comic text-2xl tracking-wide'
            : 'rounded-[50%/50%] border-4 border-ink bg-white px-10 py-6 font-body text-lg font-bold leading-snug shadow-comic',
          info && 'pt-7',
        )}
      >
        {children}
      </blockquote>
      {/* Rabicho: preenchimento cobre a borda do balão; só os dois lados levam traço. */}
      <svg
        aria-hidden
        className={cn(
          'absolute z-[2] h-10 w-12',
          shout ? '-bottom-[30px]' : '-bottom-[34px]',
          tailPosition[tail],
        )}
        viewBox="0 0 48 40"
      >
        <path d="M4 0 L36 0 L6 38 Z" fill="white" />
        <path
          d="M4 1 L6 38 L36 1"
          fill="none"
          stroke="#111"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </motion.figure>
  );
}

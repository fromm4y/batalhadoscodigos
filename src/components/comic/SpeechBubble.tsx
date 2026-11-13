import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type Speaker = 'professor' | 'capita' | 'narradora' | 'robo';

const speakerInfo: Record<Speaker, { name: string; tag: string }> = {
  professor: { name: 'O Professor', tag: 'bg-bando text-paper glow-red' },
  capita: { name: 'A Capitã', tag: 'bg-piratas text-paper glow-blue' },
  narradora: { name: 'A Narradora', tag: 'bg-brass text-ink glow-brass' },
  robo: { name: 'Robô', tag: 'bg-graphite-light text-paper' },
};

type TailSide = 'left' | 'right' | 'center';

const SHOUT_POINTS =
  '0,10 7,0 15,9 25,1 35,8 46,0 56,9 67,1 78,8 89,0 100,11 96,32 100,52 95,74 100,92 89,100 77,92 63,100 49,92 35,100 21,93 8,100 0,90 4,70 0,50 5,30';

const PAPER = '#EDE3CC';

type SpeechBubbleProps = {
  children: ReactNode;
  who?: Speaker;
  tail?: TailSide;
  /** Balão de grito: borda serrilhada e texto em Bangers. */
  shout?: boolean;
  /** Chiado de rádio (transmissões do Professor, Interferência). */
  glitch?: boolean;
  delay?: number;
  /** Versão baixa (tela de jogo): menos espaço vertical, mesmo estilo. */
  compact?: boolean;
  className?: string;
};

const tailPosition: Record<TailSide, string> = {
  left: 'left-8',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-8 -scale-x-100',
};

/** Balão de fala em papel envelhecido, com rabicho (VISUAL.md §4). */
export function SpeechBubble({
  children,
  who,
  tail = 'left',
  shout = false,
  glitch = false,
  delay = 0,
  compact = false,
  className,
}: SpeechBubbleProps) {
  const info = who ? speakerInfo[who] : null;
  return (
    <motion.figure
      initial={{ opacity: 0, scale: 0.4, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay }}
      style={{ transformOrigin: tail === 'right' ? '85% 100%' : '15% 100%' }}
      className={cn(
        'relative inline-block max-w-md text-ink',
        compact ? 'mb-6' : 'mb-9',
        className,
      )}
    >
      {info && (
        <figcaption
          className={cn(
            'absolute -top-4 left-5 z-10 rotate-[-2deg] border-[3px] border-ink px-2 py-0.5 font-heist text-xl tracking-wider',
            info.tag,
          )}
        >
          {info.name}
        </figcaption>
      )}
      {shout && (
        <svg
          aria-hidden
          className="absolute inset-0 z-[1] h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon points={SHOUT_POINTS} fill="#000" transform="translate(1.6 4)" />
          <polygon
            points={SHOUT_POINTS}
            fill={PAPER}
            stroke="#0A0A0A"
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
            : cn(
                'rounded-[50%/50%] border-4 border-ink bg-aged font-body font-bold leading-snug shadow-comic',
                compact ? 'px-8 py-2 text-base' : 'px-10 py-6 text-lg',
              ),
          info && (compact ? 'pt-5' : 'pt-7'),
        )}
      >
        <span className={cn('block', glitch && 'animate-glitch')}>{children}</span>
        {glitch && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[50%/50%] bg-[repeating-linear-gradient(0deg,rgb(0_0_0/0.07)_0_2px,transparent_2px_4px)]"
          />
        )}
      </blockquote>
      <svg
        aria-hidden
        className={cn(
          'absolute z-[2]',
          compact ? 'h-7 w-9' : 'h-10 w-12',
          shout ? '-bottom-[30px]' : compact ? '-bottom-[23px]' : '-bottom-[34px]',
          tailPosition[tail],
        )}
        viewBox="0 0 48 40"
      >
        <path d="M4 0 L36 0 L6 38 Z" fill={PAPER} />
        <path
          d="M4 1 L6 38 L36 1"
          fill="none"
          stroke="#0A0A0A"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
    </motion.figure>
  );
}

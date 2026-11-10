import { motion } from 'framer-motion';
import { useState } from 'react';
import { ComicArt, ComicButton, cn } from '@/components/comic';
import type { GameMode, Side } from '@/types/domain';

type SideScreenProps = {
  side: Side | null;
  mode: GameMode | null;
  onSide: (s: Side) => void;
  onMode: (m: GameMode) => void;
  onNext: () => void;
};

const SIDES = {
  red: {
    title: 'BANDO',
    icon: '🎭',
    motto: 'Entrar. Pegar. Sumir.',
    mission: 'Abra a vitrine e capture a Máquina Analítica antes que os Piratas tranquem tudo.',
    art: 'lado-bando',
  },
  blue: {
    title: 'PIRATAS',
    icon: '⚓',
    motto: 'Ninguém toca no nosso tesouro.',
    mission: 'Proteja a Máquina Analítica e mantenha a vitrine trancada até o fim.',
    art: 'lado-piratas',
  },
} as const;

/** Fallbacks em CSS/SVG enquanto as cenas `lado-bando` / `lado-piratas` não existem. */
function BandoScene() {
  return (
    <div className="absolute inset-0 bg-blueprint">
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M30 260 Q120 200 160 220 T260 140 T370 60"
          fill="none"
          stroke="#E63946"
          strokeWidth="4"
          strokeDasharray="10 8"
          style={{ filter: 'drop-shadow(0 0 6px #E63946)' }}
        />
        <circle cx="370" cy="60" r="14" fill="none" stroke="#D4A537" strokeWidth="4" />
        <path
          d="M60 60 h100 v60 h-100z M220 200 h120 v70 h-120z"
          fill="none"
          stroke="rgb(150 175 210 / 0.5)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
function PiratasScene() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(#0a1230,#0B2A7A)]">
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <circle
          cx="300"
          cy="70"
          r="34"
          fill="#FFF4C2"
          style={{ filter: 'drop-shadow(0 0 24px #2F6BFF)' }}
        />
        <path
          d="M0 230 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V300 H0z"
          fill="#0B1A4a"
        />
        <g stroke="#0A0A0A" strokeWidth="3">
          <path d="M110 220 h150 l-20 26 h-110z" fill="#3b2a12" />
          <line x1="185" y1="220" x2="185" y2="110" />
          <path d="M187 115 l50 40 h-50z" fill="#EDE3CC" />
          <path d="M183 125 l-45 50 h45z" fill="#EDE3CC" />
        </g>
      </svg>
    </div>
  );
}

/** 8.2 Escolha do lado — "De que lado você está?" */
export function SideScreen({ side, mode, onSide, onMode, onNext }: SideScreenProps) {
  const [hover, setHover] = useState<Side | null>(null);
  const focus = hover ?? side;

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <h2 className="py-4 text-center font-heist text-5xl tracking-[0.12em] text-paper text-glow-spot">
        DE QUE LADO VOCÊ ESTÁ?
      </h2>
      <div className="relative grid flex-1 grid-cols-2">
        {(['red', 'blue'] as const).map((s) => {
          const info = SIDES[s];
          const lit = focus === s;
          const dim = focus !== null && !lit;
          const red = s === 'red';
          return (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => onSide(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(s)}
              onBlur={() => setHover(null)}
              className="group relative cursor-pointer overflow-hidden border-y-4 border-ink text-left"
            >
              <div className="absolute inset-0">
                <ComicArt
                  id={info.art}
                  alt={red ? 'Mesa de planejamento do Bando' : 'Navio dos Piratas ao luar'}
                  fallback={red ? <BandoScene /> : <PiratasScene />}
                />
              </div>
              {/* holofote */}
              <div
                aria-hidden
                className={cn(
                  'absolute inset-0 transition-all duration-500',
                  lit
                    ? 'bg-[radial-gradient(ellipse_at_50%_20%,rgb(255_244_194/0.28),transparent_60%)]'
                    : 'bg-black/30',
                  dim && 'bg-black/70',
                )}
              />
              <motion.div
                animate={{ scale: lit ? 1.04 : 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className={cn(
                  'relative flex h-full flex-col justify-end gap-3 p-10',
                  red ? 'items-start' : 'items-end text-right',
                )}
              >
                <span className="text-6xl" aria-hidden>
                  {info.icon}
                </span>
                <span
                  className={cn(
                    'font-heist text-8xl leading-none tracking-wider',
                    red ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
                    'text-outline',
                  )}
                >
                  {info.title}
                </span>
                <span className="bg-black/55 px-2 font-type text-2xl text-paper text-glow-spot">
                  “{info.motto}”
                </span>
                <span className="max-w-sm bg-black/50 p-2 font-body text-base font-semibold text-paper">
                  {info.mission}
                </span>
                {side === s && (
                  <span
                    className={cn(
                      'border-[3px] border-ink px-3 pt-1 font-heist text-2xl tracking-widest',
                      red ? 'bg-bando glow-red' : 'bg-piratas glow-blue',
                    )}
                  >
                    ✔ ESCOLHIDO
                  </span>
                )}
              </motion.div>
            </button>
          );
        })}
        {/* laser central */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 animate-laser bg-bando shadow-[0_0_10px_2px_rgb(230_57_70/0.9),0_0_30px_4px_rgb(230_57_70/0.4)]"
        />
      </div>

      <div className="flex items-center justify-center gap-5 bg-graphite py-5">
        <p className="font-heist text-3xl tracking-wider text-paper">MODO:</p>
        <ComicButton
          variant={mode === 'pessoas' ? 'brass' : 'graphite'}
          aria-pressed={mode === 'pessoas'}
          icon="👥"
          onClick={() => onMode('pessoas')}
        >
          Contra pessoas
        </ComicButton>
        <ComicButton
          variant={mode === 'maquina' ? 'brass' : 'graphite'}
          aria-pressed={mode === 'maquina'}
          icon="🤖"
          onClick={() => onMode('maquina')}
        >
          Contra a máquina
        </ComicButton>
        <ComicButton
          variant={side === 'blue' ? 'blue' : 'red'}
          size="lg"
          icon="▶"
          disabled={!side || !mode}
          onClick={onNext}
          className="ml-8"
        >
          Confirmar
        </ComicButton>
      </div>
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router';
import { cn } from '@/components/comic';
import type { GameMode, Side } from '@/types/domain';
import { BriefingScreen } from './BriefingScreen';
import { LoreScreen } from './LoreScreen';
import { SideScreen } from './SideScreen';
import { TeamScreen } from './TeamScreen';
import { UniformScreen } from './UniformScreen';

const STEPS = [
  { id: 'lore', label: 'Abertura' },
  { id: 'lado', label: 'Lado' },
  { id: 'uniforme', label: 'Uniforme' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'briefing', label: 'Briefing' },
] as const;

/**
 * PROTÓTIPO navegável das telas 8.1 → 8.5 do VISUAL.md (sem Firebase, dados falsos).
 * Serve para a May aprovar o clima antes da Etapa 1.
 */
export function PrototypePage() {
  const [step, setStep] = useState(0);
  const [side, setSide] = useState<Side | null>(null);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [runKey, setRunKey] = useState(0);

  const chosenSide: Side = side ?? 'red';
  const chosenMode: GameMode = mode ?? 'pessoas';
  const go = (n: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, n)));

  const restart = () => {
    setSide(null);
    setMode(null);
    setStep(0);
    setRunKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-noir">
      <header className="flex h-16 items-center justify-between border-b-4 border-ink bg-graphite px-6">
        <Link to="/" className="font-heist text-2xl tracking-wider text-brass">
          ← A GRANDE CAÇADA
        </Link>
        <nav aria-label="Telas do protótipo" className="flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-current={i === step ? 'step' : undefined}
              className={cn(
                'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-xl tracking-wider',
                i === step
                  ? 'bg-brass text-ink glow-brass'
                  : 'bg-graphite-light text-paper hover:bg-night',
              )}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>
        <span className="-rotate-3 border-[3px] border-double border-bando px-2 pt-1 font-heist text-xl tracking-[0.2em] text-bando">
          PROTÓTIPO
        </span>
      </header>

      <main className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${runKey}-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {step === 0 && <LoreScreen onDone={() => go(1)} />}
            {step === 1 && (
              <SideScreen
                side={side}
                mode={mode}
                onSide={setSide}
                onMode={setMode}
                onNext={() => go(2)}
              />
            )}
            {step === 2 && <UniformScreen side={chosenSide} onNext={() => go(3)} />}
            {step === 3 && <TeamScreen side={chosenSide} mode={chosenMode} onNext={() => go(4)} />}
            {step === 4 && <BriefingScreen side={chosenSide} onRestart={restart} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="flex h-20 items-center justify-between border-t-4 border-ink bg-graphite px-6">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => go(step - 1)}
          className="min-h-11 cursor-pointer px-3 font-heist text-2xl tracking-wider text-mist hover:text-paper disabled:opacity-30"
        >
          ← Tela anterior
        </button>
        <p className="font-type text-sm text-mist">
          Lado:{' '}
          <strong className="text-paper">
            {side ? (side === 'red' ? 'Bando' : 'Piratas') : '— (padrão: Bando)'}
          </strong>{' '}
          · Modo:{' '}
          <strong className="text-paper">
            {mode
              ? mode === 'pessoas'
                ? 'contra pessoas'
                : 'contra a máquina'
              : '— (padrão: pessoas)'}
          </strong>
        </p>
        <button
          type="button"
          disabled={step === STEPS.length - 1}
          onClick={() => go(step + 1)}
          className="min-h-11 cursor-pointer px-3 font-heist text-2xl tracking-wider text-mist hover:text-paper disabled:opacity-30"
        >
          Próxima tela →
        </button>
      </footer>
    </div>
  );
}

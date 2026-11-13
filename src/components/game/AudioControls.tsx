import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/audio/audioStore';
import { playSfx } from '@/audio/engine';
import { cn } from '@/components/comic';

/**
 * Controle de som (SPEC 10): botão mudo + sliders de música e efeitos.
 * `floating` fica no canto da tela (lobby, planejamento, fim); `inline` vai no rodapé do jogo.
 */
export function AudioControls({ floating = false }: { floating?: boolean }) {
  const { music, sfx, muted, setMusicVolume, setSfxVolume, toggleMute } = useAudio();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  const btn =
    'grid h-12 w-12 cursor-pointer place-items-center rounded-md border-[3px] border-ink bg-graphite-light text-2xl hover:glow-brass';

  return (
    <div
      ref={box}
      className={cn('relative flex gap-2', floating && 'fixed bottom-4 left-4 z-40')}
      role="group"
      aria-label="Som"
    >
      <button
        type="button"
        aria-pressed={muted}
        aria-label={muted ? 'Ligar o som' : 'Desligar o som'}
        title={muted ? 'Ligar o som' : 'Mudo'}
        onClick={toggleMute}
        className={btn}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <button
        type="button"
        aria-expanded={open}
        aria-label="Volume"
        title="Volume"
        onClick={() => setOpen((o) => !o)}
        className={btn}
      >
        🎚️
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-14 left-0 z-50 grid w-64 gap-3 rounded-sm border-[3px] border-ink bg-aged p-4 text-ink shadow-comic"
          >
            <Slider label="🎵 Música" value={music} onChange={setMusicVolume} />
            <Slider
              label="💥 Efeitos"
              value={sfx}
              onChange={setSfxVolume}
              onRelease={() => playSfx('lock')}
            />
            {muted && <p className="text-sm font-bold">O som está no mudo.</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  onRelease,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onRelease?: () => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="flex justify-between font-heist text-lg tracking-wider">
        {label} <span>{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onRelease}
        className="h-8 w-full cursor-pointer accent-[#7A0F18]"
      />
    </label>
  );
}

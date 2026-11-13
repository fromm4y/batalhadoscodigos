import { AnimatePresence, motion } from 'framer-motion';
import { useSfxOnMount } from '@/audio/useSfx';
import { useEffect, useRef, useState } from 'react';
import { artUrl, Onomatopoeia, cn } from '@/components/comic';
import type { MuseumEvent } from '@/content/types';
import { currentItem, secondsLeftInItem } from '@/engine/museumEvent';
import { serverNow } from '@/lib/serverClock';
import { useNow } from '@/lib/useNow';

type Props = {
  event: MuseumEvent;
  startedAtMs: number;
  /** guarda as respostas na aba (recarregar no meio do evento não perde nada) */
  storageKey: string;
  onFinish: (answers: (boolean | null)[]) => void;
};

function loadAnswers(key: string, n: number): (boolean | null)[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw) as (boolean | null)[];
  } catch {
    /* sem armazenamento: segue em memória */
  }
  return Array<boolean | null>(n).fill(null);
}

/**
 * RN-33/34: overlay de tela cheia com sirene (UÓ-UÓ!) e 3 alertas de 15 s: Real ou Falso?
 * O cadeado em andamento fica pausado embaixo.
 */
export function MuseumEventOverlay({ event, startedAtMs, storageKey, onFinish }: Props) {
  useSfxOnMount('alarm');
  useNow(250);
  const now = serverNow();
  const index = currentItem(event, startedAtMs, now);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() =>
    loadAnswers(storageKey, event.items.length),
  );
  const finished = useRef(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      /* ignora */
    }
  }, [answers, storageKey]);

  const over = now >= startedAtMs && index === -1;
  useEffect(() => {
    if (over && !finished.current) {
      finished.current = true;
      onFinish(answers);
    }
  }, [over, answers, onFinish]);

  const item = index >= 0 ? event.items[index] : null;
  const answered = index >= 0 ? answers[index] : null;
  const left = secondsLeftInItem(event, startedAtMs, now);

  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label={event.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] grid place-items-center overflow-hidden bg-black"
    >
      {artUrl('alarme-museu') && (
        <img
          src={artUrl('alarme-museu')}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div aria-hidden className="absolute inset-0 animate-alarm bg-bando" />
      <motion.div
        aria-hidden
        className="absolute top-6 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-bando"
        animate={{
          boxShadow: ['0 0 20px 10px rgb(230 57 70 / 0.8)', '0 0 80px 40px rgb(230 57 70 / 0.2)'],
        }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-5 px-6 text-center">
        <Onomatopoeia kind="alarm" size={200} />
        <h2 className="font-heist text-6xl tracking-[0.15em] text-paper text-glow-red">
          {event.title}
        </h2>
        {item ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center gap-4 rounded-hand border-4 border-ink bg-aged p-6 text-ink shadow-comic"
            >
              <p className="font-type text-sm uppercase">
                Alerta {index + 1} de {event.items.length} · ⏱ {left} s
              </p>
              <p className="font-body text-2xl font-extrabold">{item.text}</p>
              {answered === null ? (
                <div className="flex gap-4">
                  {(
                    [
                      [true, '🚨 Real', 'bg-bando text-paper'],
                      [false, '🙅 Falso', 'bg-piratas text-paper'],
                    ] as const
                  ).map(([value, label, cls]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAnswers((a) => a.map((x, i) => (i === index ? value : x)))}
                      className={cn(
                        'min-h-16 min-w-48 cursor-pointer rounded-hand border-4 border-ink px-6 pt-1 font-heist text-4xl tracking-wider shadow-comic',
                        cls,
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <p
                  role="status"
                  className={cn(
                    'font-bold',
                    answered === item.isReal ? 'text-success' : 'text-bando-dark',
                  )}
                >
                  {answered === item.isReal ? '✔ ' : '✖ '}
                  {item.explanation}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="font-type text-2xl text-paper">Analisando o alarme...</p>
        )}
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { cn } from '@/components/comic';
import type { AnagramVariant } from '@/content/types';
import { buildAnagram } from '@/engine/anagram';
import { checkAnagram } from '@/engine/challenges';
import { SubmitButton, type ChallengeBaseProps } from './common';

/**
 * anagram: letras embaralhadas viram peças (11.2). Clique numa peça para colocá-la na próxima
 * casa livre (ou arraste até uma casa). Clique numa letra colocada para devolvê-la.
 */
export function AnagramChallenge({
  variant,
  seed,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: AnagramVariant; seed: string }) {
  const layout = useMemo(() => buildAnagram(variant, seed), [variant, seed]);
  // casas[palavra][posição] = id da peça (null = vazia). Casas fixas não entram aqui.
  const [slots, setSlots] = useState<(string | null)[][]>(() =>
    layout.words.map((n) => Array<string | null>(n).fill(null)),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const tile = (id: string) => layout.tray.find((t) => t.id === id);
  const placed = new Set(slots.flat().filter(Boolean) as string[]);
  const isFixed = (w: number, i: number) => `${w}-${i}` in layout.fixed;
  const full = slots.every((word, w) => word.every((id, i) => id !== null || isFixed(w, i)));

  function place(id: string, target?: { w: number; i: number }) {
    if (locked || solved) return;
    const t = tile(id);
    if (!t) return;
    setSlots((prev) => {
      const next = prev.map((word) => word.map((x) => (x === id ? null : x)));
      const canGo = (w: number, i: number) => !isFixed(w, i) && (t.word === -1 || t.word === w);
      if (target && canGo(target.w, target.i)) {
        next[target.w]![target.i] = id;
        return next;
      }
      for (let w = 0; w < next.length; w++) {
        for (let i = 0; i < next[w]!.length; i++) {
          if (next[w]![i] === null && canGo(w, i)) {
            next[w]![i] = id;
            return next;
          }
        }
      }
      return prev;
    });
  }

  function remove(w: number, i: number) {
    if (locked || solved) return;
    setSlots((prev) =>
      prev.map((word, wi) => word.map((x, ii) => (wi === w && ii === i ? null : x))),
    );
  }

  function submit() {
    const words = slots.map((word, w) =>
      word.map((id, i) =>
        isFixed(w, i) ? layout.fixed[`${w}-${i}`]! : (tile(id ?? '')?.char ?? ''),
      ),
    );
    if (!checkAnagram(variant, words)) return onWrong();
    setSolved(true);
    setTimeout(onSolved, 600);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6" aria-label="Palavra secreta">
        {slots.map((word, w) => (
          <div key={w} className="flex gap-1.5">
            {word.map((id, i) => {
              const fixed = layout.fixed[`${w}-${i}`];
              const ch = fixed ?? (id ? tile(id)?.char : '');
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={
                    fixed
                      ? `Letra fixa ${fixed}`
                      : ch
                        ? `Letra ${ch}, clique para tirar`
                        : 'Casa vazia'
                  }
                  disabled={!!fixed || !id || locked}
                  onClick={() => remove(w, i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) place(dragId, { w, i });
                    setDragId(null);
                  }}
                  className={cn(
                    'grid h-14 w-12 place-items-center rounded-md border-[3px] font-heist text-3xl',
                    fixed
                      ? 'border-ink bg-brass text-ink'
                      : ch
                        ? cn(
                            'cursor-pointer border-ink text-ink',
                            solved ? 'bg-success' : 'bg-paper hover:bg-spotlight',
                          )
                        : 'border-dashed border-ink/50 bg-white/40',
                  )}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-hand border-2 border-dashed border-ink/40 bg-ink/5 p-3"
        aria-label="Peças embaralhadas"
      >
        {layout.tray.map((t) =>
          placed.has(t.id) ? (
            <span
              key={t.id}
              className="h-14 w-12 rounded-md border-2 border-dashed border-ink/20"
              aria-hidden
            />
          ) : (
            <motion.button
              key={t.id}
              type="button"
              layout
              draggable={!locked}
              onDragStart={() => setDragId(t.id)}
              onClick={() => place(t.id)}
              disabled={locked}
              aria-label={`Peça ${t.char}`}
              whileHover={{ y: -3, rotate: -3 }}
              className="h-14 w-12 cursor-grab rounded-md border-[3px] border-ink bg-aged font-heist text-3xl text-ink shadow-comic-sm active:cursor-grabbing disabled:opacity-50"
            >
              {t.char}
            </motion.button>
          ),
        )}
      </div>

      <div className="flex gap-3">
        <SubmitButton disabled={!full || locked || solved} onClick={submit}>
          Conferir
        </SubmitButton>
        <button
          type="button"
          disabled={locked || solved}
          onClick={() => setSlots(layout.words.map((n) => Array<string | null>(n).fill(null)))}
          className="min-h-12 cursor-pointer border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink"
        >
          ⟲ Limpar
        </button>
      </div>
    </div>
  );
}

import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/components/comic';
import type { GameTreeVariant } from '@/content/types';
import { minimaxValues } from '@/engine/boardGames';
import { checkGameTree } from '@/engine/challenges';
import { optionOrder } from '@/engine/shuffle';
import { SubmitButton, type ChallengeBaseProps } from './common';

type Sub = Record<string, number[]>;

/**
 * gameTree (Ep. 5, SPEC-03 §4.3): árvore de jogadas em neon. "Sua jogada" → "a máquina escolhe
 * o MENOR" → (nível C) "vocês escolhem o MAIOR". Cada galho tem um rascunho opcional para anotar
 * o valor que sobe (no A e no B, `livePreview` deixa o rascunho verde quando está certo).
 * Ao acertar, os valores sobem pela árvore (mostra o minimax funcionando).
 */
export function GameTreeChallenge({
  variant,
  seed,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: GameTreeVariant; seed: string }) {
  const reduce = useReducedMotion();
  const moves = Object.keys(variant.tree);
  const order = optionOrder(moves.length, seed).map((i) => moves[i]!);
  const values = minimaxValues(variant.tree);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [pick, setPick] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busy = locked || solved;
  const live = variant.livePreview === true;

  function play() {
    if (busy || !pick) return;
    if (!checkGameTree(variant, pick)) {
      setFeedback(
        'A máquina achou uma resposta que deixa vocês com menos. Olhem o que ELA escolheria!',
      );
      return onWrong();
    }
    setFeedback(null);
    setSolved(true);
    setTimeout(onSolved, 1800);
  }

  /** Caixinha de rascunho: o valor que sobe por aquele galho. */
  function draftBox(id: string, right: number, label: string) {
    const v = draft[id] ?? '';
    const ok = live && v !== '' && Number(v) === right;
    const bad = live && v !== '' && Number(v) !== right;
    if (solved)
      return (
        <motion.span
          initial={reduce ? false : { y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: id.split('/').length === 2 ? 0.2 : 0.7 }}
          className="grid h-8 w-10 place-items-center rounded-sm border-2 border-success bg-night font-heist text-xl text-success"
          aria-label={`${label}: ${right}`}
        >
          {right}
        </motion.span>
      );
    return (
      <input
        value={v}
        disabled={busy}
        onChange={(e) =>
          setDraft({ ...draft, [id]: e.target.value.replace(/\D/g, '').slice(0, 2) })
        }
        inputMode="numeric"
        placeholder="?"
        aria-label={`Rascunho: ${label}`}
        className={cn(
          'h-8 w-10 rounded-sm border-2 bg-white text-center font-heist text-xl text-ink',
          ok ? 'border-success bg-[#d9f7e6]' : bad ? 'border-alert' : 'border-ink',
        )}
      />
    );
  }

  const leaf = (n: number, i: number) => (
    <span
      key={i}
      className="grid h-9 min-w-9 place-items-center rounded-full border-2 border-[#4b5878] bg-night px-1.5 font-heist text-2xl text-spotlight"
    >
      {n}
    </span>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-type text-sm">
        <span>🟡 Sua jogada</span>
        <span>
          → 🔴 a máquina escolhe o <strong>MENOR</strong>
        </span>
        {variant.depth === 3 && (
          <span>
            → 🔵 vocês escolhem o <strong>MAIOR</strong>
          </span>
        )}
      </div>
      <ul
        className="grid gap-2 rounded-md border-[3px] border-ink bg-[linear-gradient(180deg,#1b2033,#0e111b)] p-2.5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
        aria-label="Árvore de jogadas"
      >
        {order.map((move) => {
          const sub = variant.tree[move]!;
          const chosen = pick === move;
          return (
            <li
              key={move}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-md border-2 p-1.5',
                chosen ? 'border-brass bg-[#2b2615]' : 'border-[#2b3550]',
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={chosen}
                disabled={busy}
                onClick={() => {
                  setPick(move);
                  setFeedback(null);
                }}
                className={cn(
                  'min-h-11 w-full cursor-pointer rounded-sm border-[3px] border-ink px-2 pt-1 font-heist text-xl tracking-wider disabled:cursor-default',
                  chosen ? 'bg-brass text-ink glow-brass' : 'bg-paper text-ink hover:bg-spotlight',
                )}
              >
                {chosen ? '✔ ' : ''}
                {move}
              </button>
              <span className="flex items-center gap-1 font-type text-xs text-bando">
                🔴 máquina:
                {draftBox(move, values[move]!, `valor da ${move}`)}
              </span>
              <span aria-hidden className="h-2 w-0.5 bg-bando/70" />
              {Array.isArray(sub) ? (
                <div className="flex flex-wrap justify-center gap-1.5">{sub.map(leaf)}</div>
              ) : (
                <div className="flex w-full flex-wrap justify-center gap-1 lg:flex-nowrap">
                  {Object.entries(sub as Sub).map(([r, leaves]) => (
                    <div
                      key={r}
                      className="flex flex-col items-center gap-0.5 rounded-sm border border-[#2b3550] px-1 py-0.5"
                    >
                      <span className="font-type text-xs text-piratas">
                        {r} · 🔵
                        {draftBox(`${move}/${r}`, Math.max(...leaves), `${move}, ${r}`)}
                      </span>
                      <div className="flex gap-1">{leaves.map(leaf)}</div>
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {feedback && (
        <p
          role="status"
          className="border-2 border-dashed border-alert bg-night/40 px-3 py-1.5 font-type text-paper"
        >
          {feedback}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={busy || !pick} onClick={play} icon="♟️">
          Jogar!
        </SubmitButton>
        <p className="max-w-96 font-type text-sm">
          {solved
            ? '✨ Os valores subiram pela árvore: é assim que a máquina pensa!'
            : 'O rascunho é só para vocês pensarem: não vale ponto. Escolham a jogada e joguem!'}
        </p>
      </div>
    </div>
  );
}

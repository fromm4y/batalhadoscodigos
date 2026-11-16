import { useRef, useState } from 'react';
import { cn } from '@/components/comic';
import type { CipherVariant } from '@/content/types';
import { checkCipher, checkCipherVerify } from '@/engine/challenges';
import { decodeText } from '@/engine/cipher';
import { optionOrder } from '@/engine/shuffle';
import { CipherWheel } from './CipherWheel';
import { SubmitButton, WaitingTransmission, type ChallengeBaseProps } from './common';

const onlyLetter = (raw: string) =>
  raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

/**
 * cipher (Ep. 2, SPEC-03 §1). Bando: decifrar (decode), decifrar com a chave falada e quebrar
 * (crack). Piratas: cifrar (encode), cifrar com a chave falada e verificar (verify).
 */
export function CipherChallenge({
  variant,
  heard,
  seed,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: CipherVariant; heard: boolean; seed: string }) {
  const preset = variant.wheel === 'preset';
  const waiting = variant.spokenKey === true && !heard;
  const [key, setKey] = useState(preset ? variant.shift : 0);
  const [solved, setSolved] = useState(false);
  const busy = locked || solved || waiting;

  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[auto_1fr]">
      <CipherWheel
        value={key}
        onChange={setKey}
        locked={preset || waiting || solved}
        hideKey={waiting}
      />
      <div className="flex min-w-0 flex-col gap-3">
        {waiting && <WaitingTransmission />}
        {variant.spokenKey && heard && (
          <p className="font-type text-sm">🎧 Usem a chave que a Narradora falou no rádio.</p>
        )}
        {variant.mode === 'verify' ? (
          <VerifyPanel
            variant={variant}
            seed={seed}
            disabled={busy}
            onPick={(i) => {
              if (busy) return;
              if (!checkCipherVerify(variant, i)) return onWrong();
              setSolved(true);
              setTimeout(onSolved, 600);
            }}
          />
        ) : (
          <TypePanel
            variant={variant}
            dialKey={key}
            disabled={busy}
            onSubmit={(typed) => {
              if (busy) return;
              if (!checkCipher(variant, typed)) return onWrong();
              setSolved(true);
              setTimeout(onSolved, 600);
            }}
          />
        )}
      </div>
    </div>
  );
}

/** decode/encode/crack: a fita de telégrafo com uma caixinha embaixo de cada letra. */
function TypePanel({
  variant,
  dialKey,
  disabled,
  onSubmit,
}: {
  variant: CipherVariant;
  dialKey: number;
  disabled: boolean;
  onSubmit: (typed: string) => void;
}) {
  const tape = (variant.text ?? '').toUpperCase();
  const [letters, setLetters] = useState<string[]>(() => [...tape].map(() => ''));
  const complete = [...tape].every((c, i) => c === ' ' || letters[i]);
  const typed = [...tape].map((c, i) => (c === ' ' ? ' ' : (letters[i] ?? ''))).join('');
  const crack = variant.mode === 'crack';

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (complete) onSubmit(typed);
      }}
    >
      <p className="flex flex-wrap items-baseline gap-x-4 font-type text-xs uppercase">
        <span>
          {variant.mode === 'encode'
            ? '📜 Mensagem original → escrevam embaixo a versão cifrada'
            : '📡 Mensagem interceptada → escrevam embaixo o que ela diz'}
        </span>
        {variant.crib && (
          <span className="text-base normal-case">
            🧩 Crib: começa com <strong>{variant.crib}</strong>
          </span>
        )}
      </p>
      <LetterBoxes tape={tape} letters={letters} setLetters={setLetters} disabled={disabled} />
      {crack && (
        <p
          className="rounded-sm border-2 border-dashed border-ink/50 bg-night/10 px-3 py-1 font-type text-base"
          aria-live="polite"
        >
          🔎 Teste rápido (chave {dialKey}):{' '}
          <span className="font-heist text-2xl tracking-[0.15em]">{decodeText(tape, dialKey)}</span>
        </p>
      )}
      <div>
        <SubmitButton disabled={disabled || !complete} onClick={() => onSubmit(typed)} />
      </div>
    </form>
  );
}

/** Uma coluna por letra: em cima a letra da fita, embaixo a caixinha (espaços já marcados). */
function LetterBoxes({
  tape,
  letters,
  setLetters,
  disabled,
  compact,
}: {
  tape: string;
  letters: string[];
  setLetters: (l: string[]) => void;
  disabled: boolean;
  /** rascunho do verify: caixinhas menores */
  compact?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = [...tape].map((c, i) => ({ c, i })).filter((x) => x.c !== ' ');
  const focusSlot = (from: number, dir: 1 | -1) => {
    const order = slots.map((s) => s.i);
    const at = order.indexOf(from) + dir;
    refs.current[order[at] ?? -1]?.focus();
  };
  const words: { c: string; i: number }[][] = [[]];
  [...tape].forEach((c, i) => (c === ' ' ? words.push([]) : words.at(-1)!.push({ c, i })));

  return (
    <div
      className="flex flex-wrap gap-x-5 gap-y-2"
      role="group"
      aria-label="Mensagem, letra por letra"
    >
      {words.map((w, wi) => (
        <div key={wi} className="flex gap-1">
          {w.map(({ c, i }) => (
            <label key={i} className={cn('flex flex-col items-center', compact ? 'w-8' : 'w-9')}>
              <span
                aria-hidden
                className={cn(
                  'grid place-items-center border-y-2 border-dashed border-ink/50 bg-[#efe2c2] font-heist',
                  compact ? 'h-7 w-8 text-xl' : 'h-8 w-9 text-2xl',
                )}
              >
                {c}
              </span>
              <span className="sr-only">
                Letra {slots.findIndex((s) => s.i === i) + 1}, na fita: {c}
              </span>
              <input
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={letters[i] ?? ''}
                disabled={disabled}
                maxLength={2}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
                onChange={(e) => {
                  const ch = onlyLetter(e.target.value).slice(-1);
                  const next = [...letters];
                  next[i] = ch;
                  setLetters(next);
                  if (ch) focusSlot(i, 1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !letters[i]) {
                    e.preventDefault();
                    focusSlot(i, -1);
                  } else if (e.key === 'ArrowLeft') focusSlot(i, -1);
                  else if (e.key === 'ArrowRight') focusSlot(i, 1);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = [...onlyLetter(e.clipboardData.getData('text'))];
                  const next = [...letters];
                  const order = slots.map((s) => s.i);
                  let at = order.indexOf(i);
                  for (const ch of pasted) {
                    if (at >= order.length) break;
                    next[order[at]!] = ch;
                    at++;
                  }
                  setLetters(next);
                }}
                className={cn(
                  'mt-0.5 border-[3px] border-ink bg-white text-center font-heist text-ink uppercase disabled:opacity-50',
                  compact ? 'h-9 w-8 text-xl' : 'h-11 w-9 text-2xl',
                )}
              />
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * verify (Piratas, Cofre): só uma mensagem foi cifrada com a chave do dia. A dupla escolhe
 * uma, usa o rascunho para decifrar (dica: a primeira palavra já entrega) e confirma.
 * A ordem das mensagens é própria de cada dupla.
 */
function VerifyPanel({
  variant,
  seed,
  disabled,
  onPick,
}: {
  variant: CipherVariant;
  seed: string;
  disabled: boolean;
  onPick: (originalIndex: number) => void;
}) {
  const options = variant.options ?? [];
  const order = optionOrder(options.length, seed);
  const [chosen, setChosen] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const tape = chosen === null ? '' : options[chosen]!;

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Mensagens interceptadas" className="grid gap-1.5">
        {order.map((i, pos) => (
          <button
            key={options[i]}
            type="button"
            role="radio"
            aria-checked={chosen === i}
            disabled={disabled}
            onClick={() => setChosen(i)}
            className={cn(
              'flex min-h-11 cursor-pointer items-center gap-3 rounded-hand border-[3px] border-ink px-3 py-0.5 text-left disabled:cursor-not-allowed disabled:opacity-60',
              chosen === i ? 'bg-spotlight shadow-comic-sm' : 'bg-paper hover:bg-spotlight/60',
            )}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink font-heist text-lg text-paper">
              {chosen === i ? '📻' : pos + 1}
            </span>
            <span className="font-heist text-2xl tracking-[0.12em]">{options[i]}</span>
          </button>
        ))}
      </div>
      {chosen !== null && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <SubmitButton disabled={disabled} onClick={() => onPick(chosen)} icon="📻">
              É esta a mensagem!
            </SubmitButton>
            <p className="font-type text-xs uppercase">
              ✏️ Rascunho abaixo: decifrem com o disco para conferir (não precisa terminar)
            </p>
          </div>
          <LetterBoxes
            key={chosen}
            tape={tape}
            letters={drafts[chosen] ?? [...tape].map(() => '')}
            setLetters={(l) => setDrafts((d) => ({ ...d, [chosen]: l }))}
            disabled={disabled}
            compact
          />
        </>
      )}
    </div>
  );
}

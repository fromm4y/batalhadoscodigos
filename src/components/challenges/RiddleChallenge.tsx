import { useState } from 'react';
import type { RiddleVariant } from '@/content/types';
import { checkRiddle } from '@/engine/challenges';
import { AnswerButton, SubmitButton, type ChallengeBaseProps } from './common';

/** riddle: charada de escolha ou de texto livre (respostas normalizadas, RN-28). */
export function RiddleChallenge({
  variant,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: RiddleVariant }) {
  const [text, setText] = useState('');
  const [right, setRight] = useState<string | null>(null);

  function submit(answer: string) {
    if (locked || right) return;
    if (!checkRiddle(variant, answer)) return onWrong();
    setRight(answer);
    setTimeout(onSolved, 600);
  }

  return (
    <div className="flex flex-col gap-4">
      <blockquote className="border-l-4 border-ink/40 pl-4 font-type text-xl leading-relaxed">
        “{variant.text}”
      </blockquote>
      {variant.mode === 'choice' ? (
        <div className="flex flex-col gap-3">
          {(variant.options ?? []).map((opt, i) => (
            <AnswerButton
              key={opt}
              letter={String.fromCharCode(65 + i)}
              onClick={() => submit(opt)}
              disabled={locked}
              state={right === opt ? 'right' : 'idle'}
            >
              {opt}
            </AnswerButton>
          ))}
        </div>
      ) : (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) submit(text);
          }}
        >
          <label className="grid flex-1 gap-1">
            <span className="font-type text-sm uppercase">Sua resposta</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={60}
              autoComplete="off"
              spellCheck={false}
              disabled={locked}
              className="min-h-12 border-[3px] border-ink bg-white px-3 font-body text-xl font-bold text-ink"
            />
          </label>
          <SubmitButton
            disabled={locked || !text.trim()}
            onClick={() => text.trim() && submit(text)}
          />
        </form>
      )}
    </div>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { QuizVariant } from '@/content/types';
import { checkQuiz } from '@/engine/challenges';
import { AnswerButton, type ChallengeBaseProps } from './common';

/** quiz: perguntas em sequência; erro = −2 e a pergunta continua; acertar todas abre (11.2). */
export function QuizChallenge({
  variant,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: QuizVariant }) {
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState<number | null>(null);
  const q = variant.questions[index];
  if (!q) return null;

  function answer(option: number) {
    if (locked || right !== null) return;
    if (!checkQuiz(variant, index, option)) return onWrong();
    setRight(option);
    setTimeout(() => {
      setRight(null);
      if (index + 1 >= variant.questions.length) onSolved();
      else setIndex(index + 1);
    }, 700);
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex gap-2"
        aria-label={`Pergunta ${index + 1} de ${variant.questions.length}`}
      >
        {variant.questions.map((_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-full border-2 border-ink ${i < index ? 'bg-success' : i === index ? 'bg-brass' : 'bg-graphite-light'}`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="flex flex-col gap-3"
        >
          <p className="font-body text-xl font-extrabold">
            {index + 1}. {q.q}
          </p>
          {q.options.map((opt, i) => (
            <AnswerButton
              key={opt}
              letter={String.fromCharCode(65 + i)}
              onClick={() => answer(i)}
              disabled={locked}
              state={right === i ? 'right' : 'idle'}
            >
              {opt}
            </AnswerButton>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

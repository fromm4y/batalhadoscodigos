import { useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/components/comic';

type TypewriterProps = {
  text: string;
  /** ms por caractere */
  speed?: number;
  delay?: number;
  onDone?: () => void;
  className?: string;
};

/** Texto de máquina de escrever (Special Elite). Clique para pular. */
export function Typewriter({ text, speed = 55, delay = 0, onDone, className }: TypewriterProps) {
  const reduce = useReducedMotion();
  // Por caractere visível (code point), para não partir emojis ao meio.
  const chars = Array.from(text);
  const [count, setCount] = useState(reduce ? chars.length : 0);
  const done = count >= chars.length;

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setCount((c) => c + 1), count === 0 ? delay : speed);
    return () => clearTimeout(t);
    // onDone muda a cada render do pai; só o progresso importa aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, done, speed, delay]);

  return (
    <p
      className={cn('font-type', className)}
      onClick={() => setCount(chars.length)}
      aria-label={text}
    >
      <span aria-hidden>{chars.slice(0, count).join('')}</span>
      <span
        aria-hidden
        className={cn('ml-0.5 inline-block w-[0.55em]', done ? 'animate-pulse' : '')}
      >
        ▌
      </span>
    </p>
  );
}

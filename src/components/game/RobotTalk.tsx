import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { playSfx } from '@/audio/engine';
import { SpeechBubble } from '@/components/comic';
import { RobotFigure } from '@/components/scene';
import type { MatchLogEntry } from '@/types/domain';

/** O Robô provocando em balão de HQ (RN-44): pula e faz "bip-bop" a cada fala nova. */
export function RobotTalk({
  mood,
  line,
}: {
  mood: 'provocando' | 'derrotado' | 'feliz';
  line: MatchLogEntry | null;
}) {
  const reduce = useReducedMotion();
  const seen = useRef<number | null>(line?.at ?? null);
  const key = line?.at ?? 0;
  useEffect(() => {
    if (line && seen.current !== line.at) playSfx('robot');
    seen.current = line?.at ?? null;
  }, [line]);

  return (
    <div className="flex items-end gap-1">
      <motion.div
        key={`r${key}`}
        className="shrink-0"
        animate={reduce || !line ? {} : { y: [0, -10, 0, -5, 0], rotate: [0, -4, 3, 0] }}
        transition={{ duration: 0.6 }}
      >
        <RobotFigure className="h-20 w-16" mood={mood} />
      </motion.div>
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={key}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            aria-live="polite"
          >
            <SpeechBubble who="robo" tail="left" compact className="mb-8 max-w-none">
              {line.text}
            </SpeechBubble>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

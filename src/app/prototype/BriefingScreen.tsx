import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ComicButton, Onomatopoeia, SpeechBubble } from '@/components/comic';
import { RouteMap } from '@/components/scene';
import type { Side } from '@/types/domain';

const LINES = {
  red: [
    'Atenção, equipe. Esta é a planta do museu.',
    'São 3 cadeados até o Cofre. Cada cadeado aberto acende a rota.',
    'Os Piratas vão tentar trancar tudo antes. Sejam rápidos... e silenciosos.',
  ],
  blue: [
    'Marujos, olhem a carta: o tesouro está marcado com um X.',
    'Precisamos montar 3 defesas no caminho. Cada uma acende no mapa.',
    'O Bando já está a caminho. Ninguém encosta no nosso tesouro!',
  ],
} as const;

/** 8.5 Briefing da missão — "O Plano" (Bando) / "O Mapa" (Piratas). */
export function BriefingScreen({ side, onRestart }: { side: Side; onRestart: () => void }) {
  const red = side === 'red';
  const [line, setLine] = useState(0);
  const [opened, setOpened] = useState(0);
  const [pop, setPop] = useState(0);
  const lines = LINES[side];
  const done = line >= lines.length - 1;

  return (
    <div className="grid min-h-[calc(100vh-9rem)] grid-cols-[1.6fr_1fr] items-center gap-8 px-10 py-6">
      <div className="relative">
        <h2
          className={`mb-3 font-heist text-5xl tracking-[0.12em] ${red ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue'}`}
        >
          {red ? 'O PLANO' : 'O MAPA'}
        </h2>
        <RouteMap theme={red ? 'bando' : 'piratas'} opened={opened} goalReached={opened > 3} />
        {pop > 0 && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
            <Onomatopoeia kind={opened > 3 ? 'boom' : 'click'} playKey={pop} size={170} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <SpeechBubble
            key={line}
            who={red ? 'professor' : 'capita'}
            glitch={red}
            tail="left"
            className="max-w-none"
          >
            {lines[line]}
          </SpeechBubble>
        </AnimatePresence>
        {!done ? (
          <ComicButton
            variant="brass"
            icon="▶"
            onClick={() => setLine((n) => n + 1)}
            className="self-start"
          >
            Continuar
          </ComicButton>
        ) : (
          <div className="flex flex-col gap-3 rounded-hand border-2 border-dashed border-brass/60 p-4">
            <p className="font-type text-mist">
              Durante o jogo, este mapa fica na coluna da esquerda como trilha de progresso. Teste:
            </p>
            <ComicButton
              variant="success"
              icon="🔓"
              disabled={opened > 3}
              onClick={() => {
                setOpened((n) => Math.min(4, n + 1));
                setPop((n) => n + 1);
              }}
            >
              {opened < 3
                ? `Abrir cadeado ${opened + 1}`
                : opened === 3
                  ? red
                    ? 'Abrir o Cofre'
                    : 'Proteger o tesouro'
                  : 'Missão cumprida!'}
            </ComicButton>
            <ComicButton variant="graphite" icon="⟲" onClick={onRestart}>
              Recomeçar o protótipo
            </ComicButton>
          </div>
        )}
      </div>
    </div>
  );
}

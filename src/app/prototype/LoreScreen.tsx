import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ComicArt, ComicButton, ComicPanel, SpeechBubble, cn } from '@/components/comic';
import { FlashlightReveal, MuseumFacade, Spotlights, Typewriter } from '@/components/scene';

type Stage = 'typing' | 'flashlight' | 'comic';

/** 8.1 Lore — "Abertura do episódio". */
export function LoreScreen({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('typing');
  const [panels, setPanels] = useState(1);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-9rem)] bg-black">
      <AnimatePresence mode="wait">
        {stage === 'typing' && (
          <motion.div
            key="typing"
            exit={{ opacity: 0 }}
            className="grid min-h-[calc(100vh-9rem)] place-items-center"
          >
            <Typewriter
              text="Museu Nacional da Tecnologia. 23h58."
              delay={600}
              speed={70}
              className="text-4xl text-paper text-glow-spot"
              onDone={() => setTimeout(() => setStage('flashlight'), 1100)}
            />
          </motion.div>
        )}

        {stage === 'flashlight' && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FlashlightReveal className="h-[calc(100vh-9rem)] cursor-none">
              <ComicArt
                id="capa-entrada"
                alt="Fachada do museu à noite"
                fallback={<MuseumFacade className="h-full w-full" />}
              />
            </FlashlightReveal>
            <div className="pointer-events-none absolute inset-x-0 top-8 text-center">
              <p className="font-type text-xl text-paper text-glow-spot">
                🔦 Mexa o mouse para iluminar o museu...
              </p>
            </div>
            <div className="absolute inset-x-0 bottom-10 flex justify-center">
              <ComicButton variant="brass" size="lg" icon="▶" onClick={() => setStage('comic')}>
                Entrar no museu
              </ComicButton>
            </div>
          </motion.div>
        )}

        {stage === 'comic' && (
          <motion.div
            key="comic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative mx-auto max-w-6xl px-8 pt-7 pb-4"
          >
            <Spotlights intensity={0.08} />
            <div className="relative grid grid-cols-6 gap-5">
              {panels >= 1 && (
                <ComicPanel
                  caption="Museu Nacional da Tecnologia. 23h58."
                  flush
                  className="col-span-4 h-44"
                  tilt={-0.6}
                >
                  <ComicArt
                    id="museu-noite"
                    alt="O museu à meia-noite"
                    fallback={<MuseumFacade className="h-full w-full" />}
                  />
                </ComicPanel>
              )}
              {panels >= 2 && (
                <ComicPanel
                  tone="paper"
                  className="col-span-2 flex flex-col justify-center"
                  tilt={0.8}
                >
                  <p className="font-type text-lg leading-relaxed">
                    Amanhã o museu abre a exposição com as maiores invenções da história.
                  </p>
                  <p className="mt-3 font-type text-lg leading-relaxed">
                    A estrela da noite:{' '}
                    <strong className="font-heist text-2xl tracking-wider">
                      a Máquina Analítica.
                    </strong>
                  </p>
                </ComicPanel>
              )}
              {panels >= 3 && (
                <ComicPanel
                  tone="night"
                  className="col-span-2 flex flex-col items-center justify-center gap-3 text-center"
                  tilt={-0.8}
                >
                  <p className="font-type text-paper">
                    Para testar a segurança, o museu contratou dois times.
                  </p>
                  <div className="flex w-full gap-2">
                    <span className="flex-1 border-[3px] border-ink bg-halftone-red py-2 font-heist text-2xl tracking-wider glow-red">
                      🎭 ENTRAR
                    </span>
                    <span className="flex-1 border-[3px] border-ink bg-halftone-blue py-2 font-heist text-2xl tracking-wider glow-blue">
                      ⚓ IMPEDIR
                    </span>
                  </div>
                </ComicPanel>
              )}
              {panels >= 4 && (
                <ComicPanel tone="red" className="col-span-2 flex flex-col gap-2 p-3" tilt={0.5}>
                  <div className="h-16 overflow-hidden border-[3px] border-ink">
                    <ComicArt id="professor-sombra" alt="O Professor na sombra" />
                  </div>
                  <SpeechBubble
                    who="professor"
                    glitch
                    tail="right"
                    className="max-w-none text-base"
                  >
                    O segredo dessa máquina está nos cartões. Peguem os cartões e a vitrine é nossa.
                  </SpeechBubble>
                </ComicPanel>
              )}
              {panels >= 5 && (
                <ComicPanel tone="blue" className="col-span-2 flex flex-col gap-2 p-3" tilt={-0.5}>
                  <div className="h-16 overflow-hidden border-[3px] border-ink">
                    <ComicArt id="capita-navio" alt="A Capitã no navio" />
                  </div>
                  <SpeechBubble who="capita" tail="left" className="max-w-none text-base">
                    Esse é o tesouro que ensinou o mundo a programar. Ninguém encosta nele!
                  </SpeechBubble>
                </ComicPanel>
              )}
            </div>
            <div className="relative mt-4 flex justify-end">
              {panels < 5 ? (
                <ComicButton
                  variant="brass"
                  size="lg"
                  icon="▶"
                  onClick={() => setPanels((n) => n + 1)}
                >
                  Continuar
                </ComicButton>
              ) : (
                <ComicButton variant="red" size="lg" icon="⚡" onClick={onDone}>
                  Escolher meu lado
                </ComicButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canSkip && stage !== 'comic' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4"
          >
            <button
              type="button"
              onClick={() => {
                setStage('comic');
                setPanels(5);
              }}
              className={cn(
                'min-h-11 border-2 border-paper/50 px-4 font-heist text-xl tracking-widest text-paper/80 hover:text-paper',
              )}
            >
              PULAR ⏭
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/avatar/Avatar';
import { HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Dossier, Dust, Spotlights, Typewriter, WantedPoster } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import type { TeamDoc } from '@/types/domain';

type Props = { team: TeamDoc; episodeTitle: string; curiosities: string[] };

/** Fase `lobby`: a ficha da dupla girando + "Aguardando a Narradora..." + curiosidades (SPEC 9.2, item 4). */
export function LobbyScreen({ team, episodeTitle, curiosities }: Props) {
  const reduce = useReducedMotion();
  const [face, setFace] = useState<'red' | 'blue'>('red');
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFace((f) => (f === 'red' ? 'blue' : 'red')), 4500);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (curiosities.length < 2) return;
    const t = setInterval(
      () => setTip((i) => (i + 1) % curiosities.length),
      GAME_RULES.ui.curiosityRotateSeconds * 1000,
    );
    return () => clearInterval(t);
  }, [curiosities.length]);

  return (
    <HalftoneBackground>
      <Spotlights beams={[{ x: '30%', angle: 4, sweep: 8, duration: 7 }]} intensity={0.18} />
      <Dust />
      <main className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-[1fr_1.1fr] items-center gap-12 p-10">
        <div className="flex justify-center [perspective:1200px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={face}
              initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.45 }}
            >
              {face === 'red' ? (
                <Dossier
                  title={`Ficha: codinome ${team.cityName}`}
                  rotate={-2}
                  className="w-[24rem]"
                >
                  <div className="flex items-center gap-4">
                    <Avatar avatar={team.avatar} side="red" className="h-36 w-32" />
                    <dl className="grid gap-1 text-sm">
                      <dt className="font-type">Equipe:</dt>
                      <dd className="font-bold">Bando</dd>
                      <dt className="font-type">Ouro guardado:</dt>
                      <dd className="font-heist text-2xl tracking-wider">
                        🪙 {team.totalPoints} barras
                      </dd>
                    </dl>
                  </div>
                </Dossier>
              ) : (
                <WantedPoster name={team.pirateName} reward={team.totalPoints} rotate={2}>
                  <Avatar avatar={team.avatar} side="blue" className="h-full w-full" />
                </WantedPoster>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <p className="font-type text-lg text-mist">Hoje no museu: {episodeTitle}</p>
            <h1 className="font-heist text-6xl leading-none tracking-[0.08em] text-paper text-glow-spot">
              <span className="text-bando text-glow-red">{team.cityName}</span>{' '}
              <span className="text-mist">·</span>{' '}
              <span className="text-piratas text-glow-blue">{team.pirateName}</span>
            </h1>
          </div>
          <div role="status" aria-live="polite">
            <Typewriter
              text="Aguardando a Narradora..."
              speed={70}
              className="text-3xl text-brass text-glow-brass"
            />
          </div>
          {curiosities.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={tip}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <SpeechBubble who="narradora" tail="left" className="max-w-xl">
                  <span className="mb-1 block font-type text-sm uppercase">Você sabia?</span>
                  {curiosities[tip]}
                </SpeechBubble>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </HalftoneBackground>
  );
}

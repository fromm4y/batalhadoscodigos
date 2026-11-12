import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, Onomatopoeia, cn } from '@/components/comic';
import { Polaroid, RobotFigure, Typewriter, WantedPoster } from '@/components/scene';
import type { GameMode, Side } from '@/types/domain';
import { BLUE_TEAMS, MY_TEAM, RED_TEAMS, type SampleTeam } from './sampleData';

/** 8.4 Formação dos times — "A equipe está montada" + VERSUS. */
export function TeamScreen({
  side,
  mode,
  onNext,
}: {
  side: Side;
  mode: GameMode;
  onNext: () => void;
}) {
  const [versus, setVersus] = useState(false);
  const reds: SampleTeam[] = side === 'red' ? [MY_TEAM, ...RED_TEAMS] : RED_TEAMS;
  const blues: SampleTeam[] = side === 'blue' ? [MY_TEAM, ...BLUE_TEAMS] : BLUE_TEAMS;
  const rival = side === 'red' ? BLUE_TEAMS[0]! : RED_TEAMS[0]!;

  if (versus) {
    return <VersusScreen side={side} rival={mode === 'maquina' ? null : rival} onNext={onNext} />;
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col gap-4 px-10 py-6">
      <div className="text-center">
        <h2 className="font-heist text-5xl tracking-[0.12em] text-paper text-glow-spot">
          A EQUIPE ESTÁ MONTADA
        </h2>
        <Typewriter
          text="Aguardando a Narradora formar os confrontos..."
          className="text-lg text-mist"
          speed={40}
        />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-8">
        {/* Mural do Bando */}
        <section
          aria-label="Bando"
          className="relative rounded-hand border-4 border-ink bg-[#2a1f1a] bg-[radial-gradient(rgb(0_0_0/0.25)_1px,transparent_1.5px)] bg-[length:6px_6px] p-5 shadow-comic"
        >
          <h3 className="mb-3 font-heist text-4xl tracking-wider text-bando text-glow-red">
            🎭 MURAL DO BANDO
          </h3>
          <div className="flex flex-wrap justify-center gap-5 pt-2">
            {reds.map((t, i) => (
              <Polaroid
                key={t.city}
                caption={t === MY_TEAM ? `${t.city} (vocês!)` : t.city}
                rotate={[-4, 3, -2, 5][i % 4]}
                delay={i * 0.15}
                className={cn(t === MY_TEAM && 'ring-4 ring-bando glow-red')}
              >
                <Avatar avatar={t.avatar} side="red" className="h-full w-full bg-[#3a1418]" />
              </Polaroid>
            ))}
          </div>
        </section>
        {/* Convés dos Piratas */}
        <section
          aria-label="Piratas"
          className="rounded-hand border-4 border-ink bg-[repeating-linear-gradient(90deg,#3b2a12_0_46px,#2e200d_46px_50px)] p-5 shadow-comic"
        >
          <h3 className="mb-3 font-heist text-4xl tracking-wider text-piratas text-glow-blue">
            ⚓ CONVÉS DOS PIRATAS
          </h3>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {blues.map((t, i) => (
              <WantedPoster
                key={t.pirate}
                size="sm"
                name={t.pirate}
                reward={t.points}
                rotate={[3, -3, 2, -4][i % 4]}
                delay={i * 0.15}
                className={cn(t === MY_TEAM && 'ring-4 ring-piratas glow-blue')}
              >
                <Avatar avatar={t.avatar} side="blue" className="h-full w-full" />
              </WantedPoster>
            ))}
          </div>
        </section>
      </div>
      <div className="flex items-center justify-center gap-4 rounded-hand border-2 border-dashed border-brass/60 p-3">
        <span className="font-type text-mist">
          Simulação (no jogo, quem faz isso é a Narradora):
        </span>
        <ComicButton variant="brass" icon="⚔️" onClick={() => setVersus(true)}>
          Formar confrontos
        </ComicButton>
      </div>
    </div>
  );
}

function VersusScreen({
  side,
  rival,
  onNext,
}: {
  side: Side;
  rival: SampleTeam | null;
  onNext: () => void;
}) {
  const reduce = useReducedMotion();
  const red = side === 'red';
  const left = red
    ? { team: MY_TEAM as SampleTeam | null, s: 'red' as Side }
    : { team: rival, s: 'red' as Side };
  const right = red
    ? { team: rival, s: 'blue' as Side }
    : { team: MY_TEAM as SampleTeam | null, s: 'blue' as Side };

  return (
    <div className="relative grid min-h-[calc(100vh-9rem)] grid-cols-[1fr_auto_1fr] items-center overflow-hidden bg-black px-10">
      <Fighter team={left.team} s={left.s} delay={0.1} reduce={reduce} />
      <div className="relative grid place-items-center">
        <Onomatopoeia kind="custom" text="VS" size={220} rotate={-6} />
      </div>
      <Fighter team={right.team} s={right.s} delay={0.5} reduce={reduce} />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3"
        >
          {!rival && (
            <p className="max-w-lg bg-aged px-4 py-2 text-center font-comic text-2xl tracking-wide text-ink shadow-comic">
              “Bip bop... calculando sua derrota.” 🤖
            </p>
          )}
          <ComicButton variant="brass" size="lg" icon="🗺️" onClick={onNext}>
            Ver o plano
          </ComicButton>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Fighter({
  team,
  s,
  delay,
  reduce,
}: {
  team: SampleTeam | null;
  s: Side;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: s === 'red' ? -120 : 120 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 16, delay }}
      className="relative flex flex-col items-center gap-3"
    >
      {/* holofote acendendo */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.6 : [0, 1, 0.3, 1] }}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
        className="absolute -top-[30vh] left-1/2 h-[80vh] w-[28rem] -translate-x-1/2"
        style={{
          background: `conic-gradient(from 0deg at 50% 0%, transparent 165deg, ${s === 'red' ? 'rgb(230 57 70 / 0.35)' : 'rgb(47 107 255 / 0.35)'} 172deg, rgb(255 244 194 / 0.25) 180deg, ${s === 'red' ? 'rgb(230 57 70 / 0.35)' : 'rgb(47 107 255 / 0.35)'} 188deg, transparent 195deg)`,
          filter: 'blur(4px)',
        }}
      />
      {team ? (
        <Avatar avatar={team.avatar} side={s} className="relative h-72 w-64" />
      ) : (
        <RobotFigure className="relative h-72 w-64" />
      )}
      <p
        className={cn(
          'relative font-heist text-5xl tracking-wider text-outline',
          s === 'red' ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
        )}
      >
        {team ? (s === 'red' ? team.city : team.pirate) : 'O ROBÔ'}
      </p>
      <p className="relative font-type text-paper">{s === 'red' ? 'BANDO' : 'PIRATAS'}</p>
    </motion.div>
  );
}

import { motion, useReducedMotion } from 'framer-motion';
import { useSfxOnMount } from '@/audio/useSfx';
import { Avatar } from '@/components/avatar/Avatar';
import { HalftoneBackground, Onomatopoeia, cn } from '@/components/comic';
import { RobotFigure, Typewriter } from '@/components/scene';
import { pickTaunt } from '@/content/robot';
import type { Side, TeamDoc } from '@/types/domain';

type Fighter = { team: TeamDoc | null; side: Side };

/** Tela VERSUS (VISUAL 8.4): dois holofotes acendendo sobre os avatares, com estrondo. */
export function VersusScreen({
  me,
  side,
  rival,
}: {
  me: TeamDoc;
  side: Side;
  rival: TeamDoc | null;
}) {
  useSfxOnMount('whoosh', 300);
  useSfxOnMount('stamp', 900);
  const left: Fighter = side === 'red' ? { team: me, side: 'red' } : { team: rival, side: 'red' };
  const right: Fighter =
    side === 'blue' ? { team: me, side: 'blue' } : { team: rival, side: 'blue' };
  return (
    <HalftoneBackground>
      <main className="relative grid min-h-screen grid-cols-[1fr_auto_1fr] items-center overflow-hidden bg-black/60 px-10">
        <FighterView f={left} mine={side === 'red'} delay={0.1} />
        <div className="grid place-items-center">
          <Onomatopoeia kind="custom" text="VS" size={220} rotate={-6} />
        </div>
        <FighterView f={right} mine={side === 'blue'} delay={0.5} />
        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3">
          {!rival && (
            <p className="max-w-lg bg-aged px-4 py-2 text-center font-comic text-2xl tracking-wide text-ink shadow-comic">
              “{pickTaunt('start', () => 0)}” 🤖
            </p>
          )}
          <Typewriter
            text="Aguardando a Narradora liberar os cadeados..."
            speed={45}
            className="text-xl text-brass text-glow-brass"
          />
        </div>
      </main>
    </HalftoneBackground>
  );
}

function FighterView({ f, mine, delay }: { f: Fighter; mine: boolean; delay: number }) {
  const reduce = useReducedMotion();
  const red = f.side === 'red';
  const name = f.team ? (red ? f.team.cityName : f.team.pirateName) : 'O ROBÔ';
  const beam = red ? 'rgb(230 57 70 / 0.35)' : 'rgb(47 107 255 / 0.35)';
  return (
    <motion.div
      initial={{ opacity: 0, x: red ? -120 : 120 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 16, delay }}
      className="relative flex flex-col items-center gap-3"
    >
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: reduce ? 0.6 : [0, 1, 0.3, 1] }}
        transition={{ duration: 0.6, delay: delay + 0.1 }}
        className="absolute -top-[30vh] left-1/2 h-[80vh] w-[28rem] -translate-x-1/2"
        style={{
          background: `conic-gradient(from 0deg at 50% 0%, transparent 165deg, ${beam} 172deg, rgb(255 244 194 / 0.25) 180deg, ${beam} 188deg, transparent 195deg)`,
          filter: 'blur(4px)',
        }}
      />
      {f.team ? (
        <Avatar
          avatar={f.team.avatar}
          side={f.side}
          className="relative h-72 w-64"
          title={`Avatar de ${name}`}
        />
      ) : (
        <RobotFigure className="relative h-72 w-64" />
      )}
      <p
        className={cn(
          'relative font-heist text-5xl tracking-wider text-outline',
          red ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
        )}
      >
        {name}
      </p>
      <p className="relative font-type text-paper">
        {red ? 'BANDO' : 'PIRATAS'} {mine && '· vocês'}
      </p>
    </motion.div>
  );
}

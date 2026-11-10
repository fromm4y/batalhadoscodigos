import { motion } from 'framer-motion';
import { useState } from 'react';
import { AvatarPreview } from '@/components/avatar/AvatarPreview';
import { ComicButton, Onomatopoeia } from '@/components/comic';
import { Dossier, Dust, Spotlights, WantedPoster } from '@/components/scene';
import type { AvatarConfig, Side } from '@/types/domain';
import { MY_TEAM } from './sampleData';

const SKINS: AvatarConfig['skin'][] = [1, 2, 3, 4, 5, 6];

/** 8.3 Caracterização — "Vista o uniforme". */
export function UniformScreen({ side, onNext }: { side: Side; onNext: () => void }) {
  const [dressed, setDressed] = useState(false);
  const [avatar, setAvatar] = useState<AvatarConfig>(MY_TEAM.avatar);
  const red = side === 'red';

  return (
    <div className="relative grid min-h-[calc(100vh-9rem)] grid-cols-[1fr_1fr] items-center gap-10 overflow-hidden px-16 py-8">
      <Spotlights beams={[{ x: '27%', angle: 0, sweep: 4, duration: 6 }]} intensity={0.22} />
      <Dust />
      <div className="relative flex flex-col items-center gap-6">
        <h2 className="font-heist text-5xl tracking-[0.12em] text-paper text-glow-spot">
          VISTA O UNIFORME
        </h2>
        <div className="relative">
          <motion.div
            animate={dressed ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="relative z-[1]"
          >
            <AvatarPreview
              avatar={avatar}
              side={dressed ? side : null}
              className="h-80 w-72 drop-shadow-[0_0_30px_rgb(255_244_194/0.25)]"
            />
          </motion.div>
          {/* palco */}
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 h-8 w-64 -translate-x-1/2 rounded-[50%] bg-spotlight/20 blur-md"
          />
          {dressed && (
            <div className="pointer-events-none absolute -top-6 -right-28 z-[2]">
              <Onomatopoeia kind="custom" text={red ? 'ZÍÍP!' : 'PLOFT!'} size={150} />
            </div>
          )}
        </div>
        {!dressed && (
          <div className="flex items-center gap-2" role="group" aria-label="Tom de pele (prévia)">
            <span className="font-type text-sm text-mist">pele:</span>
            {SKINS.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Tom de pele ${s}`}
                aria-pressed={avatar.skin === s}
                onClick={() => setAvatar((a) => ({ ...a, skin: s }))}
                className="h-11 w-11 cursor-pointer rounded-full border-[3px] border-ink aria-pressed:outline-3 aria-pressed:outline-brass"
                style={{
                  background: ['#F6D2B6', '#E8B48F', '#C98C62', '#A06A43', '#7A4A2A', '#4E2E1A'][
                    s - 1
                  ],
                }}
              />
            ))}
          </div>
        )}
        {dressed ? (
          <ComicButton variant={red ? 'red' : 'blue'} size="lg" icon="▶" onClick={onNext}>
            Pronto para a missão
          </ComicButton>
        ) : (
          <ComicButton
            variant="brass"
            size="lg"
            icon={red ? '🎭' : '👒'}
            onClick={() => setDressed(true)}
          >
            Vestir o uniforme
          </ComicButton>
        )}
      </div>

      <div className="relative flex justify-center">
        {red ? (
          <Dossier title={`Ficha: codinome ${MY_TEAM.city}`} rotate={2} className="w-[26rem]">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="font-type">Equipe:</dt>
              <dd>Bando</dd>
              <dt className="font-type">Especialidade:</dt>
              <dd>abrir cadeados</dd>
              <dt className="font-type">Ouro roubado:</dt>
              <dd className="font-heist text-2xl tracking-wider">🪙 {MY_TEAM.points} barras</dd>
              <dt className="font-type">Missões:</dt>
              <dd>0 (primeira vez)</dd>
            </dl>
          </Dossier>
        ) : (
          <WantedPoster name={MY_TEAM.pirate} reward={MY_TEAM.points} rotate={-2}>
            <AvatarPreview
              avatar={avatar}
              side={dressed ? 'blue' : null}
              className="h-full w-full"
            />
          </WantedPoster>
        )}
      </div>
    </div>
  );
}

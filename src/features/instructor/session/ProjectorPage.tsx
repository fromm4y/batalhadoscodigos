import { AnimatePresence, motion } from 'framer-motion';
import { FreezeOverlay } from '@/features/game/FreezeOverlay';
import { TransmissionOverlay } from '@/features/game/TransmissionOverlay';
import { useParams } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { GameLogo, HalftoneBackground } from '@/components/comic';
import { Dust, Lasers, Spotlights, Typewriter } from '@/components/scene';
import { SEASON } from '@/content/season';
import { useNow } from '@/lib/useNow';
import { useClassTeams, useSession, useSessionPlayers } from '../data';

/**
 * `/projetor/:sessionId` — tela do projetor (SPEC 9.4), letras grandes para o fundo da sala.
 * Etapa 2: lobby (código gigante + duplas que já entraram). As demais fases chegam na Etapa 6.
 */
export function ProjectorPage() {
  const { sessionId = '' } = useParams();
  const session = useSession(sessionId);
  const teams = useClassTeams(session.data?.classId ?? null);
  const players = useSessionPlayers(sessionId);
  const now = useNow(10_000);
  const s = session.data;

  if (session.loading) return <HalftoneBackground>{null}</HalftoneBackground>;
  const finished = !s || s.status === 'finished' || s.expiresAt.toMillis() <= now;
  const episode = s ? SEASON.find((e) => e.id === s.episodeId) : undefined;
  const teamById = new Map(teams.data.map((t) => [t.id, t]));
  const joined = players.data.map((p) => teamById.get(p.teamId)).filter((t) => !!t);
  const host = window.location.host;

  return (
    <HalftoneBackground>
      <Spotlights />
      <Lasers lasers={[{ top: '93%', angle: -1 }]} />
      <Dust />
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 p-10 text-center">
        {finished ? (
          <>
            <GameLogo />
            <Typewriter
              text="Fim da transmissão. Até a próxima missão!"
              className="text-4xl text-paper text-glow-spot"
            />
          </>
        ) : s.phase !== 'lobby' ? (
          <>
            <GameLogo size="md" />
            <p className="font-type text-3xl text-mist">
              A tela desta fase chega na Etapa 6 da construção.
            </p>
          </>
        ) : (
          <>
            <p className="font-type text-3xl text-mist">
              {episode ? `Episódio ${episode.number}: ${episode.title}` : ''}
            </p>
            <div className="flex items-center gap-16">
              <div>
                <p className="font-heist text-4xl tracking-[0.15em] text-paper">Entrem em</p>
                <p className="font-heist text-5xl tracking-wider text-brass text-glow-brass">
                  {host}
                </p>
                <p className="mt-6 font-heist text-4xl tracking-[0.15em] text-paper">
                  e digitem o código
                </p>
              </div>
              <motion.p
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="rounded-hand border-8 border-ink bg-aged px-10 pt-6 pb-2 font-heist text-[11rem] leading-none tracking-[0.18em] text-ink shadow-[12px_12px_0_#000] glow-brass"
                aria-label={`Código ${s.code.split('').join(' ')}`}
              >
                {s.code}
              </motion.p>
            </div>
            <section aria-label="Duplas que já entraram" className="w-full max-w-6xl">
              <p className="mb-3 font-heist text-3xl tracking-wider text-paper">
                {joined.length === 0
                  ? 'Esperando a primeira dupla...'
                  : `${joined.length} dupla(s) na missão`}
              </p>
              <ul className="flex flex-wrap justify-center gap-5">
                <AnimatePresence>
                  {joined.map((t) => (
                    <motion.li
                      key={t.id}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="flex flex-col items-center"
                    >
                      <Avatar avatar={t.avatar} className="h-28 w-24" decorative />
                      <span className="font-heist text-2xl tracking-wider text-paper">
                        {t.cityName}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          </>
        )}
      </main>
      <AnimatePresence>
        {!finished && s.transmission?.active && <TransmissionOverlay />}
      </AnimatePresence>
      <AnimatePresence>
        {!finished && s.freeze?.active && <FreezeOverlay message={s.freeze.message} />}
      </AnimatePresence>
    </HalftoneBackground>
  );
}

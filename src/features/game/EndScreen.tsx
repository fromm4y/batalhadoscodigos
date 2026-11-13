import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import {
  ComicArt,
  ComicButton,
  ComicPanel,
  HalftoneBackground,
  Onomatopoeia,
  SpeechBubble,
  cn,
} from '@/components/comic';
import { RankingPodium } from '@/components/game/RankingPodium';
import { SessionHighlight } from '@/components/game/SessionHighlight';
import { BrassFrame, Spotlights, Stamp, Typewriter } from '@/components/scene';
import type { Episode } from '@/content/types';
import { ledgerSum } from '@/engine/ranking';
import type { LedgerEntryDoc, MatchDoc, PlayerDoc, TeamDoc } from '@/types/domain';
import { LEDGER_LABEL } from './ledgerLabels';

type Props = {
  episode: Episode;
  team: TeamDoc;
  teamId: string;
  player: PlayerDoc;
  match: MatchDoc | null;
  classTeams: (TeamDoc & { id: string })[];
  ledger: (LedgerEntryDoc & { id: string })[];
  /** pontos de hoje de todas as duplas (destaque da aula) */
  sessionPlayers: PlayerDoc[];
};

const STEPS = ['result', 'ranking', 'reveal', 'hook'] as const;
type Step = (typeof STEPS)[number];
const STEP_LABEL: Record<Step, string> = {
  result: 'Resultado',
  ranking: 'Ranking',
  reveal: 'Revelação',
  hook: '???',
};

/**
 * Fase `end` (RN-53, VISUAL 8.7): resultado do confronto, extrato do episódio, ranking da turma,
 * revelação histórica + carta do Álbum do Museu e o gancho "TRANSMISSÃO INTERCEPTADA".
 * Em capítulos, para cada parte caber inteira em 1366×768.
 */
export function EndScreen({
  episode,
  team,
  teamId,
  player,
  match,
  classTeams,
  ledger,
  sessionPlayers,
}: Props) {
  const [step, setStep] = useState<Step>('result');
  const next = STEPS[STEPS.indexOf(step) + 1];

  return (
    <HalftoneBackground>
      <Spotlights intensity={step === 'hook' ? 0.05 : 0.14} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-8 py-6">
        <header className="flex items-center justify-between">
          <p className="font-type text-mist">
            Fim do episódio {episode.number} · {episode.title}
          </p>
          <nav aria-label="Fim do episódio" className="flex gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-current={step === s ? 'step' : undefined}
                onClick={() => setStep(s)}
                className={cn(
                  'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
                  step === s
                    ? s === 'hook'
                      ? 'bg-bando text-paper'
                      : 'bg-brass text-ink'
                    : 'bg-graphite-light text-paper',
                )}
              >
                {i + 1}. {STEP_LABEL[s]}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col gap-5"
          >
            {step === 'result' && (
              <ResultChapter team={team} player={player} match={match} ledger={ledger} />
            )}
            {step === 'ranking' && (
              <div className="flex flex-col items-center gap-4">
                <h1 className="font-heist text-5xl tracking-[0.12em] text-brass text-glow-brass">
                  RANKING DA TURMA
                </h1>
                <SessionHighlight
                  teams={classTeams}
                  players={sessionPlayers}
                  highlightId={teamId}
                />
                <RankingPodium
                  teams={classTeams}
                  highlightId={teamId}
                  maxRest={3}
                  className="w-full max-w-3xl"
                />
              </div>
            )}
            {step === 'reveal' && <RevealChapter episode={episode} />}
            {step === 'hook' && <HookChapter episode={episode} />}
          </motion.section>
        </AnimatePresence>

        {next && (
          <ComicButton
            variant={next === 'hook' ? 'red' : 'brass'}
            icon="▶"
            className="self-end"
            onClick={() => setStep(next)}
          >
            {next === 'hook' ? 'Uma transmissão está chegando...' : `Ver: ${STEP_LABEL[next]}`}
          </ComicButton>
        )}
      </main>
    </HalftoneBackground>
  );
}

function ResultChapter({
  team,
  player,
  match,
  ledger,
}: {
  team: TeamDoc;
  player: PlayerDoc;
  match: MatchDoc | null;
  ledger: (LedgerEntryDoc & { id: string })[];
}) {
  const reduce = useReducedMotion();
  const red = player.side !== 'blue';
  const won = match?.winner === player.side || (!match && !!player.progress.vaultSolvedAt);
  // RN-53: resultado do confronto em quadro gigante.
  const result = !match?.winner
    ? null
    : match.winner === 'draw'
      ? {
          title: 'EMPATE!',
          tone: 'text-brass',
          text: 'Ninguém cedeu um centímetro. +2 para cada lado!',
        }
      : match.winner === player.side
        ? {
            title: 'VITÓRIA!',
            tone: 'text-success',
            text: red ? 'A vitrine é de vocês!' : 'O tesouro está a salvo!',
          }
        : {
            title: 'QUASE!',
            tone: 'text-alert',
            text: 'Foi por pouco. Semana que vem tem revanche!',
          };
  const today = ledgerSum(ledger);

  return (
    <div className="grid flex-1 grid-cols-[1fr_1fr] items-start gap-8">
      <div className="relative flex flex-col gap-3">
        {result ? (
          <>
            <motion.h1
              initial={reduce ? { opacity: 0 } : { scale: 2.4, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 220, damping: 13 }}
              className={cn(
                'font-comic text-9xl leading-none tracking-wide text-outline-thick',
                result.tone,
              )}
            >
              {result.title}
            </motion.h1>
            <p className="font-type text-2xl text-paper">{result.text}</p>
          </>
        ) : (
          <h1 className="font-heist text-7xl tracking-[0.1em] text-paper text-glow-spot">
            MISSÃO ENCERRADA
          </h1>
        )}
        {won && (
          <div className="absolute -top-6 right-0">
            <Onomatopoeia kind="boom" size={150} />
          </div>
        )}
        <p className="mt-2 font-type text-lg text-mist">
          Cadeados abertos: {player.progress.lockIndex}/3 · Cofre:{' '}
          {player.progress.vaultSolvedAt ? 'aberto ✔' : 'fechado'}
        </p>
        {/* RN-26: ouro no Bando, recompensa no cartaz dos Piratas. */}
        <div className="mt-3 flex items-center gap-4 rounded-hand border-[3px] border-ink bg-graphite p-4 glow-brass">
          <span className="text-6xl" aria-hidden>
            {red ? '🪙' : '💰'}
          </span>
          <div>
            <p className="font-type text-sm text-mist">
              {red ? 'Barras de ouro no total' : 'Recompensa no cartaz'}
            </p>
            <p className="font-heist text-6xl leading-none tracking-wider text-brass text-glow-brass">
              {team.totalPoints}
            </p>
          </div>
        </div>
      </div>

      <ComicPanel caption="Extrato do episódio" tone="paper" className="pt-8">
        {ledger.length === 0 ? (
          <p className="text-ink">Nenhum ponto neste episódio. Semana que vem é a vez de vocês!</p>
        ) : (
          <ol className="grid gap-1 text-ink" aria-label="Pontos ganhos no episódio">
            {ledger.map((e, i) => (
              <motion.li
                key={e.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.25 }}
                className="flex justify-between border-b border-ink/20 py-1 text-lg"
              >
                <span>{LEDGER_LABEL[e.reason] ?? e.reason}</span>
                <strong className={e.delta < 0 ? 'text-bando-dark' : 'text-success'}>
                  {e.delta > 0 ? '+' : ''}
                  {e.delta}
                </strong>
              </motion.li>
            ))}
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + ledger.length * 0.25 }}
              className="mt-2 flex justify-between font-heist text-3xl tracking-wider"
            >
              <span>Hoje</span>
              <span>
                {today > 0 ? '+' : ''}
                {today}
              </span>
            </motion.li>
          </ol>
        )}
      </ComicPanel>
    </div>
  );
}

function RevealChapter({ episode }: { episode: Episode }) {
  return (
    <div className="grid flex-1 grid-cols-[1fr_auto] items-start gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="font-heist text-4xl tracking-[0.12em] text-paper text-glow-spot">
          O QUE ACONTECEU DE VERDADE
        </h1>
        <div className="grid grid-cols-3 gap-4">
          {episode.reveal.map((p, i) => (
            <ComicPanel
              key={i}
              flush
              tone="graphite"
              caption={p.caption ? undefined : 'Revelação'}
              delay={i * 0.3}
              className="flex h-80 flex-col"
            >
              <div className="h-40 overflow-hidden">
                <ComicArt id={p.art} alt={p.caption ?? 'Quadro da revelação'} />
              </div>
              <div className="flex-1 bg-aged p-3 text-ink">
                {p.caption && <p className="font-type text-base">{p.caption}</p>}
                {p.speech && <p className="font-body text-base font-bold">“{p.speech.text}”</p>}
              </div>
            </ComicPanel>
          ))}
        </div>
        <SpeechBubble who="narradora" tail="left" className="max-w-xl">
          Olhos aqui: a Narradora vai contar a história verdadeira dessa invenção!
        </SpeechBubble>
      </div>
      <AlbumCard episode={episode} />
    </div>
  );
}

/** Álbum do Museu (VISUAL 9): a carta colecionável da invenção da semana. */
function AlbumCard({ episode }: { episode: Episode }) {
  const reduce = useReducedMotion();
  return (
    <motion.figure
      initial={reduce ? { opacity: 0 } : { rotateY: 180, opacity: 0, scale: 0.7 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.9, type: 'spring', damping: 15 }}
      className="flex w-60 flex-col items-center gap-2"
    >
      <p className="font-comic text-3xl tracking-wide text-brass text-outline">CARTA NOVA!</p>
      <BrassFrame className="w-full bg-night p-2">
        <div className="aspect-[600/840] w-full overflow-hidden">
          <ComicArt id={`carta-${episode.id}`} alt={`Carta do Álbum: ${episode.invention.name}`} />
        </div>
        <figcaption className="mt-2 text-center">
          <span className="block font-heist text-2xl leading-none tracking-wider text-paper">
            {episode.invention.name}
          </span>
          <span className="font-type text-sm text-brass">
            {episode.invention.year} · Ep. {episode.number}
          </span>
        </figcaption>
      </BrassFrame>
      <p className="text-center font-type text-sm text-mist">Guardada no Álbum do Museu</p>
    </motion.figure>
  );
}

/** Cliffhanger obrigatório (VISUAL 8.7): transmissão interceptada + silhueta da próxima invenção. */
function HookChapter({ episode }: { episode: Episode }) {
  return (
    <div className="relative grid flex-1 grid-cols-[1.1fr_1fr] items-center gap-8 rounded-hand border-4 border-ink bg-noir p-8">
      <div className="flex flex-col gap-4">
        <p className="font-heist text-5xl leading-none tracking-[0.2em] text-bando text-glow-red animate-glitch">
          TRANSMISSÃO INTERCEPTADA
        </p>
        <p className="font-type text-sm text-mist">sinal fraco · origem desconhecida · 00:00</p>
        <Typewriter
          text={episode.nextHook}
          speed={45}
          delay={800}
          className="text-2xl text-paper"
        />
      </div>
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden rounded-sm border-[3px] border-ink brightness-90">
          <ComicArt
            id={`proximo-ep${episode.number + 1}`}
            alt="Um objeto misterioso coberto por um pano, sob um holofote"
          />
        </div>
        <Stamp
          text="PRÓXIMA SEMANA"
          color="brass"
          rotate={-10}
          delay={2.2}
          onDark
          className="absolute -bottom-6 -left-6 text-4xl"
        />
      </div>
    </div>
  );
}

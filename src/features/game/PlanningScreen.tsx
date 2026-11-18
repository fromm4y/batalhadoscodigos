import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import {
  ComicArt,
  ComicButton,
  ComicPanel,
  HalftoneBackground,
  artUrl,
  SpeechBubble,
  cn,
} from '@/components/comic';
import { Dossier, RouteMap, Spotlights, Typewriter } from '@/components/scene';
import type { Episode } from '@/content/types';
import { ListenButton } from '@/components/game/ListenButton';
import { RankingPodium } from '@/components/game/RankingPodium';
import { VersusScreen } from '@/components/game/VersusScreen';
import { PreviouslyPanel } from '@/components/game/PreviouslyPanel';
import { equippableCards } from '@/engine/cards';
import type { GameMode, MatchDoc, PlayerDoc, SessionDoc, Side, TeamDoc } from '@/types/domain';
import { CardPicker } from './CardPicker';
import { previousEpisodeId } from './previousEpisode';
import { useSeasonOrder } from './useEpisodeHook';
import { useSeasonCards } from './useSeasonCards';

type Props = {
  episode: Episode;
  team: TeamDoc;
  player: PlayerDoc;
  /** confronto já formado → mostra o VERSUS */
  match: MatchDoc | null;
  rival: TeamDoc | null;
  /** chegou depois da formação: escolhe o lado e entra contra a máquina */
  late?: boolean;
  /** duplas da turma para o ranking (RN-25) */
  classTeams?: (TeamDoc & { id: string })[];
  teamId?: string;
  onChooseSide: (s: Side) => Promise<void>;
  onChooseMode: (m: GameMode) => Promise<void>;
  /** carta do Álbum levada na missão (16/11) */
  onEquipCard?: (episodeId: string | null) => void;
  /** sessão (histórico da turma para o "Anteriormente na Caçada") */
  session?: Pick<SessionDoc, 'episodeId' | 'history'>;
};

const STEP_LABEL = {
  recap: 'Anteriormente',
  comic: 'Abertura',
  dossier: 'Dossiê',
  ranking: 'Ranking',
  card: 'Carta',
  side: 'Seu lado',
} as const;
type Step = keyof typeof STEP_LABEL;

const SIDE_INFO = {
  red: { title: 'BANDO', icon: '🎭', motto: 'Entrar. Pegar. Sumir.' },
  blue: { title: 'PIRATAS', icon: '⚓', motto: 'Ninguém toca no nosso tesouro.' },
} as const;

/**
 * Fase `planning` (SPEC 7.3 e VISUAL 8.1–8.5): abertura em HQ do episódio, dossiê da invenção
 * escolha do lado e do modo (RN-11). Depois de "Formar confrontos", mostra o VERSUS.
 */
export function PlanningScreen({
  episode,
  team,
  player,
  match,
  rival,
  late,
  classTeams = [],
  teamId,
  onChooseSide,
  onChooseMode,
  onEquipCard,
  session,
}: Props) {
  const order = useSeasonOrder('student');
  const prevId = session ? previousEpisodeId(session, order) : null;
  const seasonCards = useSeasonCards();
  const prev = prevId ? seasonCards?.[prevId] : undefined;
  const [step, setStep] = useState<Step>(player.side || late ? 'side' : prevId ? 'recap' : 'comic');
  const hasCards = !!onEquipCard && equippableCards(team.cards, episode.id).length > 0;
  const steps: Step[] = [
    ...(prevId ? ['recap' as const] : []),
    'comic',
    'dossier',
    'ranking',
    ...(hasCards ? ['card' as const] : []),
    'side',
  ];
  const [busy, setBusy] = useState(false);

  const alliance = episode.alliance === true;
  if (match && player.side) {
    return (
      <VersusScreen
        me={team}
        side={player.side}
        rival={match.machineSide ? null : rival}
        alliance={alliance}
      />
    );
  }

  return (
    <HalftoneBackground>
      <Spotlights intensity={0.08} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-type text-mist">
            Episódio {episode.number} · {episode.title}
            {player.resumed && (
              <span className="ml-2 font-bold text-brass">
                ▶️ Vocês continuam de onde pararam na aula passada!
              </span>
            )}
          </p>
          <nav aria-label="Planejamento" className="flex flex-wrap gap-2">
            {steps.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-current={step === s ? 'step' : undefined}
                onClick={() => setStep(s)}
                className={cn(
                  'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
                  step === s ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
                )}
              >
                {i + 1}. {alliance && s === 'side' ? 'A Aliança' : STEP_LABEL[s]}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {step === 'recap' && (
            <motion.section
              key="recap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {prev ? (
                <PreviouslyPanel
                  recap={prev.recapOfThis}
                  title={`Episódio ${prev.number}: ${prev.title}`}
                  stats={
                    session?.history?.previously?.episodeId === prev.id
                      ? session.history.previously
                      : null
                  }
                  onDone={() => setStep('comic')}
                />
              ) : (
                <p className="font-type text-mist">Rebobinando a fita...</p>
              )}
            </motion.section>
          )}

          {step === 'comic' && (
            <motion.section
              key="comic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {episode.intro.comic.map((p, i) => (
                  <ComicPanel
                    key={i}
                    flush
                    tone="graphite"
                    caption={p.caption}
                    delay={i * 0.25}
                    tilt={i % 2 ? 0.6 : -0.6}
                    className="relative h-56"
                  >
                    <ComicArt
                      id={p.art}
                      alt={p.caption ?? p.speech?.text ?? 'Quadro da abertura'}
                    />
                    {p.speech && (
                      <div className="absolute inset-x-3 bottom-1">
                        <SpeechBubble
                          who={p.speech.who}
                          glitch={p.speech.who === 'professor'}
                          tail="left"
                          className="max-w-none text-base"
                          delay={i * 0.25 + 0.3}
                        >
                          {p.speech.text}
                        </SpeechBubble>
                      </div>
                    )}
                  </ComicPanel>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <ListenButton
                  text={episode.intro.comic
                    .map((p) => [p.caption, p.speech?.text].filter(Boolean).join('. '))
                    .join('. ')}
                />
                <ComicButton variant="brass" icon="▶" onClick={() => setStep('dossier')}>
                  Ler o dossiê
                </ComicButton>
              </div>
            </motion.section>
          )}

          {step === 'dossier' && (
            <motion.section
              key="dossier"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.2fr_1fr]"
            >
              <Dossier title={`Dossiê: ${episode.invention.name} (${episode.invention.year})`}>
                <ul className="list-disc space-y-2 pl-5 text-lg">
                  {episode.dossier.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p className="mt-3 font-type text-sm">
                  Pessoas: {episode.invention.people.join(' e ')}
                </p>
              </Dossier>
              <div className="flex flex-col gap-4">
                <SpeechBubble who="narradora" tail="left">
                  Leiam com atenção: as respostas dos primeiros desafios estão aqui! 👀
                </SpeechBubble>
                <ComicButton variant="brass" icon="▶" onClick={() => setStep('ranking')}>
                  Ver o ranking
                </ComicButton>
              </div>
            </motion.section>
          )}

          {step === 'ranking' && (
            <motion.section
              key="ranking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <h1 className="font-heist text-4xl tracking-[0.12em] sm:text-5xl text-brass text-glow-brass">
                QUEM ESTÁ NA FRENTE?
              </h1>
              <RankingPodium
                teams={classTeams}
                highlightId={teamId}
                maxRest={4}
                className="w-full max-w-3xl"
              />
              <ComicButton
                variant="red"
                size="lg"
                icon={hasCards ? '🃏' : '⚡'}
                onClick={() => setStep(hasCards ? 'card' : 'side')}
              >
                {hasCards
                  ? 'Escolher a carta da missão'
                  : alliance
                    ? 'Entrar na Aliança'
                    : 'Escolher meu lado'}
              </ComicButton>
            </motion.section>
          )}

          {step === 'card' && onEquipCard && (
            <motion.section
              key="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CardPicker
                cards={team.cards}
                episodeId={episode.id}
                equipped={player.equippedCard}
                onEquip={onEquipCard}
                onNext={() => setStep('side')}
              />
            </motion.section>
          )}

          {step === 'side' && alliance && (
            <motion.section
              key="alliance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 text-center"
            >
              <h1 className="font-heist text-4xl tracking-[0.12em] text-paper text-glow-spot sm:text-5xl">
                🎭 + ⚓ = 🤝 A ALIANÇA
              </h1>
              <p className="max-w-2xl bg-black/50 p-3 text-lg font-semibold text-paper">
                {episode.intro.red}
              </p>
              <ul className="grid max-w-3xl gap-2 text-left font-type text-base text-paper sm:grid-cols-3">
                <li className="border-2 border-brass/60 bg-graphite p-3">
                  🧩 Cada desafio que <strong>qualquer</strong> dupla resolve puxa a corda pela
                  turma.
                </li>
                <li className="border-2 border-brass/60 bg-graphite p-3">
                  🔓 A turma vence se <strong>metade das duplas</strong> abrir o Cofre antes da
                  máquina.
                </li>
                <li className="border-2 border-brass/60 bg-graphite p-3">
                  🤝 Abriu o Cofre? Vire <strong>Reforço</strong> e mande uma dica para outra dupla.
                </li>
              </ul>
              {player.mode === 'coop' ? (
                <Typewriter
                  text={
                    late
                      ? 'Entrando na Aliança...'
                      : 'Vocês estão na Aliança! Aguardando a Narradora formar o time...'
                  }
                  speed={40}
                  className="text-xl text-brass text-glow-brass"
                />
              ) : (
                <ComicButton
                  variant="brass"
                  icon="🤝"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await onChooseSide('red').finally(() => setBusy(false));
                  }}
                >
                  Entrar na Aliança
                </ComicButton>
              )}
            </motion.section>
          )}

          {step === 'side' && !alliance && (
            <motion.section
              key="side"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h1 className="text-center font-heist text-4xl tracking-[0.12em] sm:text-5xl text-paper text-glow-spot">
                DE QUE LADO VOCÊ ESTÁ?
              </h1>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {(['red', 'blue'] as const).map((s) => {
                  const red = s === 'red';
                  const chosen = player.side === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={chosen}
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        await onChooseSide(s).finally(() => setBusy(false));
                      }}
                      className={cn(
                        'relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-hand border-4 border-ink p-6 text-center transition-all',
                        red ? 'bg-halftone-red' : 'bg-halftone-blue',
                        chosen
                          ? red
                            ? 'glow-red scale-[1.02]'
                            : 'glow-blue scale-[1.02]'
                          : player.side
                            ? 'opacity-50'
                            : 'hover:scale-[1.02]',
                      )}
                    >
                      {artUrl(red ? 'lado-bando' : 'lado-piratas') && (
                        <span aria-hidden className="absolute inset-0">
                          <img
                            src={artUrl(red ? 'lado-bando' : 'lado-piratas')}
                            alt=""
                            className="h-full w-full object-cover opacity-55"
                          />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        </span>
                      )}
                      <span className="relative text-5xl" aria-hidden>
                        {SIDE_INFO[s].icon}
                      </span>
                      <span className="relative font-heist text-6xl tracking-wider text-paper text-outline">
                        {SIDE_INFO[s].title}
                      </span>
                      <span className="relative font-type text-xl text-paper">
                        “{SIDE_INFO[s].motto}”
                      </span>
                      <span className="relative max-w-sm bg-black/50 p-2 text-base font-semibold text-paper">
                        {red ? episode.intro.red : episode.intro.blue}
                      </span>
                      <span className="relative font-heist text-2xl tracking-wide text-paper">
                        Vocês serão: {red ? team.cityName : team.pirateName}
                      </span>
                      {chosen && (
                        <span className="relative border-[3px] border-ink bg-brass px-3 pt-1 font-heist text-2xl tracking-widest text-ink">
                          ✔ ESCOLHIDO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {late && (
                <p className="text-center font-type text-lg text-brass">
                  Vocês chegaram com o jogo andando: escolham o lado e enfrentem o Robô! 🤖
                </p>
              )}
              {player.side && !late && (
                <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_1fr]">
                  <RouteMap theme={player.side === 'red' ? 'bando' : 'piratas'} opened={0} />
                  <div className="flex flex-col gap-3">
                    <p className="font-heist text-3xl tracking-wider text-paper">CONTRA QUEM?</p>
                    <div className="flex gap-3" role="group" aria-label="Modo de jogo">
                      {(
                        [
                          ['pessoas', '👥 Contra pessoas'],
                          ['maquina', '🤖 Contra a máquina'],
                        ] as const
                      ).map(([m, label]) => (
                        <ComicButton
                          key={m}
                          variant={(player.mode ?? 'pessoas') === m ? 'brass' : 'graphite'}
                          aria-pressed={(player.mode ?? 'pessoas') === m}
                          onClick={() => void onChooseMode(m)}
                        >
                          {label}
                        </ComicButton>
                      ))}
                    </div>
                    <Typewriter
                      text="Aguardando a Narradora formar os confrontos..."
                      speed={40}
                      className="text-xl text-brass text-glow-brass"
                    />
                    <p className="font-type text-mist">Dá para trocar de lado e de modo até lá.</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </HalftoneBackground>
  );
}

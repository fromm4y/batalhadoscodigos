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
import { VersusScreen } from '@/components/game/VersusScreen';
import type { GameMode, MatchDoc, PlayerDoc, Side, TeamDoc } from '@/types/domain';

type Props = {
  episode: Episode;
  team: TeamDoc;
  player: PlayerDoc;
  /** confronto já formado → mostra o VERSUS */
  match: MatchDoc | null;
  rival: TeamDoc | null;
  /** chegou depois da formação: escolhe o lado e entra contra a máquina */
  late?: boolean;
  onChooseSide: (s: Side) => Promise<void>;
  onChooseMode: (m: GameMode) => Promise<void>;
};

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
  onChooseSide,
  onChooseMode,
}: Props) {
  const [step, setStep] = useState<'comic' | 'dossier' | 'side'>(
    player.side || late ? 'side' : 'comic',
  );
  const [busy, setBusy] = useState(false);

  if (match && player.side) {
    return <VersusScreen me={team} side={player.side} rival={match.machineSide ? null : rival} />;
  }

  return (
    <HalftoneBackground>
      <Spotlights intensity={0.08} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-8 py-6">
        <header className="flex items-center justify-between">
          <p className="font-type text-mist">
            Episódio {episode.number} · {episode.title}
          </p>
          <nav aria-label="Planejamento" className="flex gap-2">
            {(['comic', 'dossier', 'side'] as const).map((s, i) => (
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
                {i + 1}. {s === 'comic' ? 'Abertura' : s === 'dossier' ? 'Dossiê' : 'Seu lado'}
              </button>
            ))}
          </nav>
        </header>

        <AnimatePresence mode="wait">
          {step === 'comic' && (
            <motion.section
              key="comic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="grid grid-cols-2 gap-5">
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
              <div className="flex justify-end">
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
              className="grid grid-cols-[1.2fr_1fr] items-start gap-8"
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
                <ComicButton variant="red" size="lg" icon="⚡" onClick={() => setStep('side')}>
                  Escolher meu lado
                </ComicButton>
              </div>
            </motion.section>
          )}

          {step === 'side' && (
            <motion.section
              key="side"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <h1 className="text-center font-heist text-5xl tracking-[0.12em] text-paper text-glow-spot">
                DE QUE LADO VOCÊ ESTÁ?
              </h1>
              <div className="grid grid-cols-2 gap-6">
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
                <div className="grid grid-cols-[1fr_1fr] items-center gap-6">
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

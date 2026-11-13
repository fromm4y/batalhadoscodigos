import type { ResolvedChallenge } from '@/content/types';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '@/audio/engine';
import { AudioControls } from '@/components/game/AudioControls';
import { ListenButton } from '@/components/game/ListenButton';
import { RobotTalk } from '@/components/game/RobotTalk';
import { ChallengeView } from '@/components/challenges/ChallengeView';
import {
  ComicArt,
  HalftoneBackground,
  Onomatopoeia,
  SpeechBubble,
  cn,
  hasArt,
  type OnomatopoeiaKind,
} from '@/components/comic';
import { AbilityCards } from '@/components/game/AbilityCards';
import { InterferenceOverlay } from '@/components/game/InterferenceOverlay';
import { TugBar } from '@/components/game/TugBar';
import { BrassFrame, Dust, RouteMap, Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import type { Episode } from '@/content/types';
import { resolveChallenge, type Slot } from '@/engine/challenges';
import { currentStage, needsTransmission } from '@/engine/progress';
import { ABILITY_INFO, hasEffect, other } from '@/engine/match';
import { nextHint } from '@/engine/scoring';
import { clockOffset } from '@/lib/serverClock';
import { useNow } from '@/lib/useNow';
import type { Level, MatchDoc, PlayerDoc, SessionDoc, TeamDoc } from '@/types/domain';
import {
  buyHint,
  openLock,
  registerWrongAnswer,
  solveVault,
  activateAbility,
  addFeed,
  callHelp,
  type GameCtx,
} from './actions';

type Props = {
  ctx: GameCtx;
  episode: Episode;
  level: Level;
  session: SessionDoc;
  team: TeamDoc;
  player: PlayerDoc;
  match: MatchDoc | null;
  rival: TeamDoc | null;
};

const PHASE_TITLE = { locks: 'OS CADEADOS', vault: 'O COFRE' } as const;

/** Fases `locks` e `vault`: layout fixo do jogo (SPEC 9.2, item 6; VISUAL 8.6). */
export function PlayScreen({ ctx, episode, level, session, team, player, match, rival }: Props) {
  const side = player.side ?? 'red';
  const red = side === 'red';
  const stage = currentStage(session.phase, player.progress);
  const slot: Slot | null = stage.kind === 'challenge' ? stage.slot : null;
  const challenge = slot !== null ? resolveChallenge(episode, side, level, slot) : null;
  const usedHints = (challenge && player.hints?.[challenge.key]) || 0;
  const now = useNow(1000);
  const sNow = now + clockOffset();
  const effects = match?.effects ?? [];
  const frozenUntil = effects.find(
    (e) => e.kind === 'freeze' && e.target === side && e.until > sNow,
  );
  const frozen = frozenUntil?.kind === 'freeze' ? Math.ceil((frozenUntil.until - sNow) / 1000) : 0;
  const disguised = hasEffect(effects, 'disguise', side, sNow);
  const anchored = hasEffect(effects, 'anchor', side, sNow);
  const shielded = hasEffect(effects, 'shield', side, sNow);
  const rivalSide = other(side);
  const rivalWon = match?.winner === rivalSide;
  const vaultAdvantage = session.phase === 'vault' && match?.vaultLeader === side;
  const lastLog = match?.log.at(-1) ?? null;
  const myName = red ? team.cityName : team.pirateName;

  const [cooldown, setCooldown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState<{ kind: OnomatopoeiaKind; key: number; text?: string } | null>(
    null,
  );
  const [clue, setClue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();

  // TCHÁ! a cada puxão da barra (de qualquer lado).
  const bar = match?.bar ?? 0;
  const lastBar = useRef(bar);
  useEffect(() => {
    if (lastBar.current !== bar) playSfx('pull');
    lastBar.current = bar;
  }, [bar]);

  useEffect(() => {
    if (!pop) return;
    const t = setTimeout(() => setPop(null), 1400);
    return () => clearTimeout(t);
  }, [pop]);

  const leaderArt = red
    ? 'professor-neutro'
    : hasArt('capita-neutra')
      ? 'capita-neutra'
      : 'capita-tensa';
  const phaseStart = session.phaseStartedAt?.toMillis?.() ?? now;
  const elapsed = Math.max(0, Math.floor((now - phaseStart) / 1000));
  const guide = GAME_RULES.phaseGuideMinutes[session.phase as 'locks' | 'vault'];

  async function guard(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.error('[jogo]', err);
      setError('Ops! A conexão falhou. Tentem de novo.');
    }
  }

  function onWrong() {
    playSfx('error');
    setPop({ kind: 'errou', key: Date.now() });
    void shake.start({ x: [0, -12, 10, -6, 4, 0], transition: { duration: 0.4 } });
    setCooldown(true);
    setTimeout(() => setCooldown(false), GAME_RULES.answers.wrongAnswerCooldownMs);
    void guard(() => registerWrongAnswer(ctx));
  }

  function onSolved() {
    if (slot === null || busy) return;
    setBusy(true);
    void guard(async () => {
      if (slot === 'vault') {
        const v = await solveVault(ctx);
        playSfx('vault');
        addFeed(ctx, 'vault', `${myName} resolveu o Cofre${v.won ? ' primeiro e venceu!' : '.'}`);
        setPop({ kind: 'boom', key: Date.now() });
      } else {
        const r = await openLock(ctx, slot);
        playSfx('lock');
        addFeed(ctx, 'lock_open', `${myName} abriu o ${red ? 'cadeado' : 'defesa'} ${slot + 1}`);
        setPop(
          r.blocked
            ? { kind: 'tcha', key: Date.now() }
            : r.ability
              ? {
                  kind: 'custom',
                  key: Date.now(),
                  text: `+ ${ABILITY_INFO[r.ability].name.toUpperCase()}!`,
                }
              : { kind: 'click', key: Date.now() },
        );
        const reward = episode.sides[side].locks[slot].reward?.clue;
        setClue(reward ?? null);
      }
    }).finally(() => setBusy(false));
  }

  return (
    <HalftoneBackground>
      <Dust count={8} />
      <div className="relative flex h-screen flex-col overflow-hidden">
        {/* Topo: equipe, fase, timer e o cabo de guerra */}
        <header className="flex h-14 items-center justify-between gap-4 border-b-4 border-ink bg-graphite px-6">
          <p
            className={cn(
              'font-heist text-3xl tracking-[0.12em]',
              red ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
            )}
          >
            {red ? '🎭' : '⚓'} {red ? team.cityName : team.pirateName}
          </p>
          <p className="font-heist text-3xl tracking-[0.15em] text-paper">
            {PHASE_TITLE[session.phase as 'locks' | 'vault']}
          </p>
          <p className="font-heist text-3xl tracking-wider text-brass" aria-label="Tempo da fase">
            ⏱ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
            {String(elapsed % 60).padStart(2, '0')}
            <span className="text-xl text-mist"> / {guide}:00</span>
          </p>
        </header>

        {match && (
          <div className="border-b-4 border-ink bg-night/80 px-6 py-1">
            <TugBar
              bar={match.bar}
              redName={red ? team.cityName : (rival?.cityName ?? 'Robô')}
              blueName={red ? (rival?.pirateName ?? 'Robô') : team.pirateName}
              hidden={disguised}
            />
            <p
              className={cn(
                'flex justify-center gap-4 font-type text-sm text-mist',
                (anchored || shielded || vaultAdvantage) && 'mt-1',
              )}
              aria-live="polite"
            >
              {anchored && <span className="text-alert">⚓ Âncora: seus puxões valem metade!</span>}
              {shielded && (
                <span className="text-alert">
                  🛡️ Escudo do rival: seu próximo puxão será anulado!
                </span>
              )}
              {vaultAdvantage && (
                <span className="text-brass">
                  ⭐ Vocês estavam na frente: Dica 1 grátis no Cofre!
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-4 px-5 py-2">
          {/* Esquerda: planta / mapa como trilha de progresso */}
          <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto">
            <RouteMap
              theme={red ? 'bando' : 'piratas'}
              opened={player.progress.lockIndex}
              goalReached={!!player.progress.vaultSolvedAt}
              compact
            />
            <p className="font-type text-sm text-mist">
              {red ? 'A rota acende a cada cadeado aberto.' : 'Cada defesa montada acende no mapa.'}
            </p>
            {match && (
              <AbilityCards
                side={side}
                owned={player.abilities?.owned ?? []}
                used={player.abilities?.used ?? []}
                disabled={busy || !!match.winner}
                freeHintUseful={!!challenge && usedHints < 1}
                onUse={(id) => {
                  playSfx(id);
                  setPop({
                    kind: id === 'interferencia' ? 'zzzt' : id === 'escudo' ? 'tcha' : 'custom',
                    key: Date.now(),
                    text: ABILITY_INFO[id].name.toUpperCase() + '!',
                  });
                  void guard(() => activateAbility(ctx, id, challenge?.key ?? null));
                  addFeed(ctx, 'ability', `${myName} usou ${ABILITY_INFO[id].name}`);
                }}
              />
            )}
            {match?.machineSide && (
              <RobotTalk
                mood={
                  match.winner === match.machineSide
                    ? 'feliz'
                    : match.winner
                      ? 'derrotado'
                      : 'provocando'
                }
                line={lastLog && lastLog.side === match.machineSide ? lastLog : null}
              />
            )}
            {match && !match.machineSide && lastLog && (
              <p
                className="rounded-md border-2 border-graphite-light bg-night/60 px-2 py-1 font-type text-xs text-mist"
                aria-live="polite"
              >
                📻 {lastLog.text}
              </p>
            )}
          </aside>

          {/* Centro: o desafio */}
          <motion.section animate={shake} className="relative flex min-h-0 flex-col gap-2 pt-3">
            {rivalWon ? (
              <WaitingPanel
                text={
                  match?.machineSide
                    ? 'O Robô abriu o Cofre primeiro... QUASE!'
                    : 'O rival abriu o Cofre primeiro... QUASE!'
                }
                curiosities={episode.curiosities}
              />
            ) : challenge ? (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-ink bg-graphite">
                    <ComicArt
                      id={leaderArt}
                      alt={red ? 'O Professor' : 'A Capitã'}
                      className="object-top"
                    />
                  </div>
                  <SpeechBubble
                    key={challenge.key + (clue ?? '')}
                    who={red ? 'professor' : 'capita'}
                    glitch={red}
                    tail="left"
                    compact
                    className="max-w-none flex-1"
                  >
                    {clue ?? challenge.leaderLine}
                  </SpeechBubble>
                </div>
                {/* Só o desafio rola, e só se não couber (rede de segurança para 1366×768). */}
                <div data-challenge-scroll className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <ChallengeFrame red={red}>
                    <div className="mb-2 flex items-baseline justify-between gap-4 border-b-2 border-dashed border-ink/40 pb-1">
                      <h2 className="font-heist text-2xl tracking-wider">
                        {slot === 'vault'
                          ? '🔐'
                          : `${red ? 'Cadeado' : 'Defesa'} ${Number(slot) + 1} ·`}{' '}
                        {challenge.title}
                      </h2>
                      <div className="flex items-center gap-3">
                        <p className="font-type text-sm">{challenge.variant.prompt}</p>
                        <ListenButton text={narrationText(challenge)} />
                      </div>
                    </div>
                    {usedHints > 0 && (
                      <div className="mb-3 flex flex-col gap-1">
                        <p className="border-l-4 border-brass bg-brass/20 px-3 py-1 font-bold">
                          💡 Dica 1: {challenge.variant.hint1}
                        </p>
                        {usedHints > 1 && (
                          <p className="border-l-4 border-alert bg-alert/20 px-3 py-1 font-bold">
                            💡 Dica 2: {challenge.variant.hint2}
                          </p>
                        )}
                      </div>
                    )}
                    <ChallengeView
                      key={challenge.key}
                      challenge={challenge}
                      level={level}
                      seed={ctx.teamId}
                      heardTransmission={
                        !needsTransmission(challenge) || player.progress.heardTransmission
                      }
                      locked={cooldown || busy || frozen > 0}
                      onWrong={onWrong}
                      onSolved={onSolved}
                    />
                    {cooldown && (
                      <p role="status" className="mt-3 font-bold text-alert">
                        Respirem fundo... dá para tentar de novo em instantes.
                      </p>
                    )}
                  </ChallengeFrame>
                </div>
              </>
            ) : (
              <WaitingPanel
                text={
                  session.phase === 'vault'
                    ? 'Cofre resolvido! Aguardando a Narradora...'
                    : 'Todos os cadeados abertos! Aguardando a Narradora liberar o Cofre...'
                }
                curiosities={episode.curiosities}
              />
            )}
            {error && (
              <p role="alert" className="font-bold text-alert">
                {error}
              </p>
            )}
            <AnimatePresence>
              {pop && (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
                  exit={{ opacity: 0 }}
                >
                  <Onomatopoeia kind={pop.kind} text={pop.text} playKey={pop.key} size={240} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </div>

        {/* Rodapé: pontos e dicas */}
        <footer className="flex h-16 shrink-0 items-center justify-between gap-4 border-t-4 border-ink bg-graphite px-6">
          <div className="flex items-center gap-4">
            <AudioControls />
            <p className="font-heist text-3xl tracking-wider text-brass text-glow-brass">
              {red ? `🪙 ${team.totalPoints} barras de ouro` : `💰 Recompensa: ${team.totalPoints}`}
              <span className="ml-3 text-xl text-mist">
                (hoje: {player.episodePoints >= 0 ? '+' : ''}
                {player.episodePoints})
              </span>
            </p>
          </div>
          {challenge && (
            <div className="flex gap-3">
              <button
                type="button"
                disabled={player.helpUsed || busy}
                onClick={() =>
                  void guard(async () => {
                    await callHelp(ctx, challenge.key);
                    addFeed(ctx, 'help', `${myName} chamou ajuda em "${challenge.title}"`);
                  })
                }
                title="Uma vez por episódio, sem custo"
                className="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-[3px] border-ink bg-graphite-light px-4 pt-1 font-heist text-xl tracking-wider text-paper hover:glow-brass disabled:cursor-not-allowed disabled:opacity-50"
              >
                🙋 {player.helpUsed ? 'Ajuda a caminho' : 'Chamar a Narradora'}
              </button>
              {([1, 2] as const).map((tier) => {
                const bought = usedHints >= tier;
                const available = nextHint(usedHints as 0 | 1 | 2) === tier;
                // RN-18: quem estava na frente ao abrir o Cofre ganha a Dica 1 grátis.
                const free = tier === 1 && vaultAdvantage && slot === 'vault';
                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={!available || busy}
                    onClick={() =>
                      void guard(async () => {
                        playSfx('hint');
                        await buyHint(ctx, challenge.key, tier, free);
                      })
                    }
                    className={cn(
                      'flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-[3px] border-ink px-4 pt-1 font-heist text-xl tracking-wider disabled:cursor-not-allowed',
                      bought
                        ? 'bg-graphite-light text-mist'
                        : available
                          ? 'bg-aged text-ink hover:glow-brass'
                          : 'bg-graphite-light text-mist opacity-60',
                    )}
                  >
                    {bought ? '📭' : '💌'} Dica {tier}{' '}
                    {bought
                      ? '(aberta)'
                      : free
                        ? '(grátis ⭐)'
                        : `(${tier === 1 ? GAME_RULES.points.hint1 : GAME_RULES.points.hint2})`}
                  </button>
                );
              })}
            </div>
          )}
        </footer>
      </div>
      <AnimatePresence>
        {frozen > 0 && <InterferenceOverlay secondsLeft={frozen} />}
      </AnimatePresence>
    </HalftoneBackground>
  );
}

/** Moldura do desafio: documento confidencial (Bando) ou vitrine de latão (Piratas). */
function ChallengeFrame({ red, children }: { red: boolean; children: React.ReactNode }) {
  if (red) {
    return (
      <div className="relative rounded-sm border-[3px] border-ink bg-[#a8834a] p-2 shadow-comic">
        <div className="bg-aged p-4 text-ink">{children}</div>
      </div>
    );
  }
  return (
    <BrassFrame className="bg-graphite" tight>
      <div className="rounded-sm bg-aged p-4 text-ink">{children}</div>
    </BrassFrame>
  );
}

function WaitingPanel({ text, curiosities }: { text: string; curiosities: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => (x + 1) % Math.max(1, curiosities.length)),
      GAME_RULES.ui.curiosityRotateSeconds * 1000,
    );
    return () => clearInterval(t);
  }, [curiosities.length]);
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
      role="status"
    >
      <Typewriter text={text} speed={40} className="text-3xl text-brass text-glow-brass" />
      {curiosities.length > 0 && (
        <SpeechBubble who="narradora" tail="center" className="max-w-xl">
          <span className="mb-1 block font-type text-sm uppercase">Você sabia?</span>
          {curiosities[i]}
        </SpeechBubble>
      )}
    </div>
  );
}

/** O que o "Ouvir" lê: título, enunciado e o texto do enigma (nunca a resposta). */
function narrationText(c: ResolvedChallenge): string {
  const parts = [c.title, c.variant.prompt];
  if (c.type === 'riddle') parts.push(c.variant.text);
  if (c.type === 'quiz') parts.push(...c.variant.questions.map((q) => q.q));
  return parts.join('. ');
}

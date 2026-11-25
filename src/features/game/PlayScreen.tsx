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
import { AlbumLink } from '@/components/game/AlbumLink';
import { MissionCard } from './MissionCard';
import { InterferenceOverlay } from '@/components/game/InterferenceOverlay';
import { TugBar } from '@/components/game/TugBar';
import { BrassFrame, Dust, RouteMap, Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import type { Episode } from '@/content/types';
import {
  hasStage2,
  resolveBonus,
  resolveChallenge,
  stageKeys,
  type Slot,
} from '@/engine/challenges';
import { currentStage, needsTransmission } from '@/engine/progress';
import { ABILITY_INFO, hasEffect, other } from '@/engine/match';
import { hintCost, lightningSecondsLeft, nextHint } from '@/engine/scoring';
import { clockOffset, serverNow } from '@/lib/serverClock';
import { useNow } from '@/lib/useNow';
import type { Level, MatchDoc, PlayerDoc, SessionDoc, TeamDoc } from '@/types/domain';
import {
  buyHint,
  openLock,
  registerWrongAnswer,
  finishStageOne,
  solveBonus,
  solveVault,
  activateCard,
  activateAbility,
  addFeed,
  callHelp,
  sendReinforcement,
  type GameCtx,
} from './actions';
import { AllianceStrip } from './AllianceStrip';

type Props = {
  ctx: GameCtx;
  episode: Episode;
  level: Level;
  session: SessionDoc;
  team: TeamDoc;
  player: PlayerDoc;
  match: MatchDoc | null;
  rival: TeamDoc | null;
  /** Ep. 5: nomes das duplas da turma (para mandar reforço) */
  allianceTeams?: (TeamDoc & { id: string })[];
};

const PHASE_TITLE = { locks: 'OS CADEADOS', vault: 'O COFRE' } as const;

/** chave única para reanimar a onomatopeia (só em eventos de clique) */
const stamp = () => Date.now();

/** Fases `locks` e `vault`: layout fixo do jogo (SPEC 9.2, item 6; VISUAL 8.6). */
export function PlayScreen({
  ctx,
  episode,
  level,
  session,
  team,
  player,
  match,
  rival,
  allianceTeams = [],
}: Props) {
  const alliance = episode.alliance === true;
  const side = player.side ?? 'red';
  const red = side === 'red';
  const stage = currentStage(session.phase, player.progress);
  const slot: Slot | null = stage.kind === 'challenge' ? stage.slot : null;
  const step = stage.kind === 'challenge' ? stage.step : 0;
  const challenge = slot !== null ? resolveChallenge(episode, side, level, slot, step) : null;
  // 17/11: cada desafio pode ter 2 etapas; o cadeado só abre na última
  const twoSteps = slot !== null && hasStage2(episode, side, slot);
  const keys = slot !== null ? stageKeys(episode, side, slot) : [];
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
  const vaultAdvantage =
    session.phase === 'vault' && match?.vaultLeader === side && !player.progress.vaultSolvedAt;
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
  // Cofre Relâmpago (16/11): só para quem está no ritmo da turma (sem fase própria).
  const lightningOn = session.phase === 'vault' && !player.phaseOverride;
  const lightningLeft =
    lightningOn && !player.progress.vaultSolvedAt
      ? lightningSecondsLeft(
          level,
          phaseStart,
          sNow,
          player.cardBoost === 'lightningPlus' ? GAME_RULES.cards.lightningPlusMinutes : 0,
        )
      : 0;
  const bonus = resolveBonus(episode, side, level);
  const comboAvailable =
    !!challenge && slot !== 'vault' && keys.every((k) => !player.hints?.[k] && !player.misses?.[k]);

  async function guard(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.error('[jogo]', err);
      // 23/11: dizer o motivo de verdade (sessão vencida ou cota do dia), não só "conexão"
      const code = (err as { code?: string }).code;
      const expired = (session.expiresAt?.toMillis?.() ?? Infinity) <= serverNow();
      setError(
        expired || (code === 'permission-denied' && session.status !== 'open')
          ? '⏰ A sessão terminou. Peçam para a Narradora abrir outra: dá para continuar de onde pararam!'
          : code === 'resource-exhausted'
            ? 'O limite grátis do dia do Firebase acabou. Avisem a Narradora.'
            : 'Ops! A conexão falhou. Tentem de novo.',
      );
    }
  }

  function onWrong() {
    playSfx('error');
    // Ep. 5: o chefão contra-ataca a cada erro (pedido da May, 18/11)
    setPop(
      alliance
        ? { kind: 'custom', key: stamp(), text: 'CONTRA-ATAQUE!' }
        : { kind: 'errou', key: stamp() },
    );
    void shake.start({ x: [0, -12, 10, -6, 4, 0], transition: { duration: 0.4 } });
    setCooldown(true);
    setTimeout(() => setCooldown(false), GAME_RULES.answers.wrongAnswerCooldownMs);
    if (challenge) void guard(() => registerWrongAnswer(ctx, challenge.key));
  }

  function onSolved() {
    if (slot === null || busy) return;
    setBusy(true);
    void guard(async () => {
      if (twoSteps && step === 0) {
        // etapa 1 concluída: meio puxão e segue para a etapa 2 (mais difícil)
        const r = await finishStageOne(ctx, slot);
        playSfx('lock');
        setPop(
          r.blocked
            ? { kind: 'tcha', key: stamp() }
            : { kind: 'custom', key: stamp(), text: 'ETAPA 1 ✓ AGORA A 2!' },
        );
        addFeed(
          ctx,
          'stage',
          `${myName} passou da etapa 1 ${slot === 'vault' ? 'do Cofre' : `do ${red ? 'cadeado' : 'defesa'} ${slot + 1}`}`,
        );
      } else if (slot === 'vault') {
        const v = await solveVault(ctx, lightningOn ? { level, phaseStartMs: phaseStart } : null);
        playSfx('vault');
        addFeed(
          ctx,
          'vault',
          `${myName} resolveu o Cofre${v.won ? ' primeiro e venceu!' : '.'}${v.fast ? ' ⚡ Relâmpago!' : ''}`,
        );
        setPop(
          v.fast
            ? { kind: 'custom', key: stamp(), text: 'RELÂMPAGO! ⚡' }
            : { kind: 'boom', key: stamp() },
        );
      } else {
        const r = await openLock(ctx, slot, keys);
        playSfx('lock');
        addFeed(ctx, 'lock_open', `${myName} abriu o ${red ? 'cadeado' : 'defesa'} ${slot + 1}`);
        setPop(
          r.blocked
            ? { kind: 'tcha', key: stamp() }
            : r.ability
              ? {
                  kind: 'custom',
                  key: stamp(),
                  text: `+ ${ABILITY_INFO[r.ability].name.toUpperCase()}!`,
                }
              : r.combo
                ? { kind: 'custom', key: stamp(), text: 'COMBO! +PUXÃO' }
                : { kind: 'click', key: stamp() },
        );
        if (r.combo) addFeed(ctx, 'combo', `${myName} fez COMBO: abriu de primeira, sem dica!`);
        const reward = episode.sides[side].locks[slot].reward?.clue;
        setClue(reward ?? null);
      }
    }).finally(() => setBusy(false));
  }

  return (
    <HalftoneBackground>
      <Dust count={8} />
      <div className="relative flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
        {/* Topo: equipe, fase, timer e o cabo de guerra */}
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-4 border-ink bg-graphite px-3 py-1 sm:px-6 lg:h-14 lg:py-0">
          <p
            className={cn(
              'font-heist text-2xl tracking-[0.12em] sm:text-3xl',
              red ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
            )}
          >
            {alliance ? '🤝' : red ? '🎭' : '⚓'} {red ? team.cityName : team.pirateName}
            {alliance && <span className="ml-2 text-lg text-brass">· A Aliança</span>}
          </p>
          <p className="hidden font-heist text-3xl tracking-[0.15em] text-paper md:block">
            {PHASE_TITLE[session.phase as 'locks' | 'vault']}
          </p>
          {lightningLeft > 0 && (
            <p
              className="font-heist text-2xl tracking-wider text-spotlight text-glow-spot sm:text-3xl"
              aria-label="Tempo do Cofre Relâmpago"
              title={`Resolvam o Cofre antes de zerar: +${GAME_RULES.points.vaultFast}`}
            >
              ⚡ {String(Math.floor(lightningLeft / 60)).padStart(2, '0')}:
              {String(lightningLeft % 60).padStart(2, '0')}
            </p>
          )}
          <p
            className="font-heist text-2xl tracking-wider text-brass sm:text-3xl"
            aria-label="Tempo da fase"
          >
            ⏱ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
            {String(elapsed % 60).padStart(2, '0')}
            <span className="text-xl text-mist"> / {guide}:00</span>
          </p>
        </header>

        {match && (
          <div className="border-b-4 border-ink bg-night/80 px-3 py-1 sm:px-6">
            <TugBar
              bar={match.bar}
              redName={alliance ? 'TURMA' : red ? team.cityName : (rival?.cityName ?? 'Robô')}
              blueName={
                alliance ? 'CHEFÃO 😈' : red ? (rival?.pirateName ?? 'Robô') : team.pirateName
              }
              hidden={disguised}
            />
            <p
              className={cn(
                'flex justify-center gap-4 font-type text-sm text-mist',
                (anchored ||
                  shielded ||
                  vaultAdvantage ||
                  comboAvailable ||
                  !!player.reinforcedBy) &&
                  'mt-1',
              )}
              aria-live="polite"
            >
              {anchored && <span className="text-alert">⚓ Âncora: seus puxões valem metade!</span>}
              {shielded && (
                <span className="text-alert">
                  🛡️ Escudo do rival: seu próximo puxão será anulado!
                </span>
              )}
              {comboAvailable && !anchored && !shielded && (
                <span className="text-brass">
                  🔥 COMBO valendo: acertem de primeira, sem dica, e puxem +
                  {GAME_RULES.pull.comboBonus}!
                </span>
              )}
              {player.reinforcedBy && (
                <span className="text-success">🤝 Reforço recebido: a Dica 1 está liberada!</span>
              )}
              {vaultAdvantage && (
                <span className="text-brass">
                  ⭐ Vocês estavam na frente: Dica 1 grátis no Cofre!
                </span>
              )}
            </p>
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 px-3 py-2 sm:px-5 lg:grid-cols-[280px_1fr]">
          {/* Esquerda: planta / mapa como trilha de progresso */}
          <aside className="order-2 flex min-h-0 flex-col gap-3 lg:order-none lg:overflow-y-auto">
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
                    key: stamp(),
                    text: ABILITY_INFO[id].name.toUpperCase() + '!',
                  });
                  void guard(() => activateAbility(ctx, id, challenge?.key ?? null));
                  addFeed(ctx, 'ability', `${myName} usou ${ABILITY_INFO[id].name}`);
                }}
              />
            )}
            <MissionCard
              team={team}
              player={player}
              challengeKey={challenge?.key ?? null}
              usedHints={usedHints}
              inVault={session.phase === 'vault'}
              disabled={busy}
              onUse={(power) => {
                playSfx('hint');
                setPop({ kind: 'custom', key: stamp(), text: `${power.name.toUpperCase()}!` });
                void guard(() => activateCard(ctx, power.id, challenge?.key ?? null));
                addFeed(ctx, 'card', `${myName} usou a carta ${power.name}`);
              }}
            />
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
            {alliance && match?.coop && session.phase === 'vault' && (
              <AllianceStrip
                coop={match.coop}
                teamId={ctx.teamId}
                teams={allianceTeams}
                onSend={(to) => {
                  playSfx('hint');
                  return sendReinforcement(ctx, to);
                }}
              />
            )}
            {rivalWon ? (
              <WaitingPanel
                text={
                  alliance
                    ? 'A máquina abriu o Cofre antes da Aliança... QUASE! Continuem jogando pela turma!'
                    : match?.machineSide
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
                <div data-challenge-scroll className="min-h-0 flex-1 pr-1 lg:overflow-y-auto">
                  <ChallengeFrame red={red}>
                    <div className="mb-2 flex items-baseline justify-between gap-4 border-b-2 border-dashed border-ink/40 pb-1">
                      <h2 className="font-heist text-2xl tracking-wider">
                        {slot === 'vault'
                          ? '🔐'
                          : `${red ? 'Cadeado' : 'Defesa'} ${Number(slot) + 1} ·`}{' '}
                        {challenge.title}
                        {twoSteps && (
                          // pendurado na borda de cima da moldura: não ocupa altura (1366×768)
                          <span
                            className="absolute -top-3 left-6 z-10 rounded-sm border-2 border-ink bg-brass px-2 pt-0.5 font-heist text-base tracking-wider text-ink shadow-comic-sm"
                            aria-label={`Etapa ${step + 1} de 2`}
                          >
                            ETAPA {step + 1}/2
                          </span>
                        )}
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
            ) : session.phase === 'vault' && player.progress.vaultSolvedAt && bonus ? (
              <BonusMission
                key={bonus.key}
                ctx={ctx}
                bonus={bonus}
                red={red}
                level={level}
                leaderArt={leaderArt}
                solved={!!player.bonusSolvedAt}
                name={myName}
                curiosities={episode.curiosities}
                onPop={setPop}
              />
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
        <footer className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t-4 border-ink bg-graphite px-3 py-2 sm:px-6 lg:h-16 lg:py-0">
          <div className="flex items-center gap-4">
            <AudioControls />
            <p className="font-heist text-2xl tracking-wider text-brass text-glow-brass sm:text-3xl">
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
                        await buyHint(ctx, challenge.key, tier, free, level);
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
                        : `(${hintCost(tier, false, level)})`}
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

/**
 * Missão bônus (pedido da May, 16/11): quem já abriu o Cofre ganha um enigma extra difícil.
 * Sem dicas e sem perder ponto ao errar: é só para quem quer "bater a cabeça" mais um pouco.
 */
function BonusMission({
  ctx,
  bonus,
  red,
  level,
  leaderArt,
  solved,
  name,
  curiosities,
  onPop,
}: {
  ctx: GameCtx;
  bonus: ResolvedChallenge;
  red: boolean;
  level: Level;
  leaderArt: string;
  solved: boolean;
  name: string;
  curiosities: string[];
  onPop: (p: { kind: OnomatopoeiaKind; key: number; text?: string }) => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [busy, setBusy] = useState(false);

  if (solved)
    return (
      <WaitingPanel
        text={`🌟 Missão bônus cumprida! +${GAME_RULES.points.bonusMission}. Aguardando a Narradora...`}
        curiosities={curiosities}
      />
    );

  if (!accepted)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <p className="font-heist text-5xl tracking-[0.12em] text-brass text-glow-brass">
          🌟 MISSÃO BÔNUS
        </p>
        <SpeechBubble
          who={red ? 'professor' : 'capita'}
          glitch={red}
          tail="center"
          className="max-w-xl"
        >
          {bonus.leaderLine}
        </SpeechBubble>
        <p className="max-w-xl font-type text-lg text-mist">
          Um enigma DIFÍCIL, sem dicas. Vale +{GAME_RULES.points.bonusMission}, e errar não tira
          ponto. Topam?
        </p>
        <button
          type="button"
          onClick={() => {
            playSfx('hint');
            setAccepted(true);
          }}
          className="min-h-12 cursor-pointer rounded-md border-[3px] border-ink bg-brass px-6 pt-1 font-heist text-3xl tracking-wider text-ink shadow-comic-sm hover:glow-brass"
        >
          Aceitar a missão
        </button>
      </div>
    );

  return (
    <>
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-ink bg-graphite">
          <ComicArt id={leaderArt} alt={red ? 'O Professor' : 'A Capitã'} className="object-top" />
        </div>
        <SpeechBubble
          who={red ? 'professor' : 'capita'}
          glitch={red}
          tail="left"
          compact
          className="max-w-none flex-1"
        >
          {bonus.leaderLine}
        </SpeechBubble>
      </div>
      <div data-challenge-scroll className="min-h-0 flex-1 pr-1 lg:overflow-y-auto">
        <ChallengeFrame red={red}>
          <div className="mb-2 flex items-baseline justify-between gap-4 border-b-2 border-dashed border-ink/40 pb-1">
            <h2 className="font-heist text-2xl tracking-wider">🌟 Missão bônus · {bonus.title}</h2>
            <div className="flex items-center gap-3">
              <p className="font-type text-sm">{bonus.variant.prompt}</p>
              <ListenButton text={narrationText(bonus)} />
            </div>
          </div>
          <ChallengeView
            challenge={bonus}
            level={level}
            seed={ctx.teamId}
            heardTransmission
            locked={cooldown || busy}
            onWrong={() => {
              playSfx('error');
              onPop({ kind: 'errou', key: Date.now() });
              setCooldown(true);
              setTimeout(() => setCooldown(false), GAME_RULES.answers.wrongAnswerCooldownMs);
              void registerWrongAnswer(ctx, bonus.key, true).catch(() => undefined);
            }}
            onSolved={() => {
              if (busy) return;
              setBusy(true);
              playSfx('vault');
              onPop({ kind: 'custom', key: Date.now(), text: 'MISSÃO CUMPRIDA! 🌟' });
              addFeed(ctx, 'bonus', `${name} cumpriu a missão bônus! 🌟`);
              void solveBonus(ctx)
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
          />
          {cooldown && (
            <p role="status" className="mt-3 font-bold text-alert">
              Quase! Pensem mais um pouco... (errar aqui não tira ponto)
            </p>
          )}
        </ChallengeFrame>
      </div>
    </>
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
      <AlbumLink />
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

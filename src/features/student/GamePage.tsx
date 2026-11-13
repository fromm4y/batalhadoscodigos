import { doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { HalftoneBackground } from '@/components/comic';
import { Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { loadEpisode } from '@/content/episodes';
import type { Episode } from '@/content/types';
import { resolveChallenge } from '@/engine/challenges';
import { currentStage, needsTransmission } from '@/engine/progress';
import {
  addFeed,
  chooseMode,
  chooseSide,
  finishMuseumEvent,
  joinLateAgainstMachine,
  markHeardTransmission,
  type GameCtx,
} from '@/features/game/actions';
import { EndScreen } from '@/features/game/EndScreen';
import { PlanningScreen } from '@/features/game/PlanningScreen';
import { PlayScreen } from '@/features/game/PlayScreen';
import { TransmissionOverlay } from '@/features/game/TransmissionOverlay';
import { getFirebase } from '@/lib/firebase';
import { calibrate, serverNow } from '@/lib/serverClock';
import type { ClassDoc, Level, MatchDoc, PlayerDoc, SessionDoc, TeamDoc } from '@/types/domain';
import { machineTick } from '@/features/game/machine';
import { FreezeOverlay } from '@/features/game/FreezeOverlay';
import { JailScreen } from '@/features/game/JailScreen';
import { MuseumEventOverlay } from '@/features/game/MuseumEventOverlay';
import { eventDurationMs, eventSucceeded, jailUntilMs } from '@/engine/museumEvent';
import { useNow } from '@/lib/useNow';
import { setMusic, type MusicTheme } from '@/audio/engine';
import { AudioControls } from '@/components/game/AudioControls';
import { LobbyScreen } from './LobbyScreen';
import { NoSignalScreen } from './NoSignalScreen';
import { useEndPlayers, useSessionLedger, useStudentClassTeams } from './useStudentData';
import { useTeamAuth, type TeamClaims } from './useTeamAuth';

/** `/jogo` — tela única do jogo, que muda conforme a fase da sessão (SPEC 9.2). */
export function GamePage() {
  const auth = useTeamAuth();
  if (auth.status === 'loading') return <Waiting text="Reconectando..." />;
  if (auth.status === 'none') return <NoSignalScreen />;
  return <Game claims={auth.claims} />;
}

function Game({ claims }: { claims: TeamClaims }) {
  const [session, setSession] = useState<SessionDoc | null | 'missing'>(null);
  const [team, setTeam] = useState<TeamDoc | null>(null);
  const [player, setPlayer] = useState<PlayerDoc | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);

  // Sessão em tempo real (fase, encerramento).
  useEffect(() => {
    const { db } = getFirebase('student');
    return onSnapshot(
      doc(db, 'sessions', claims.sessionId),
      (snap) => setSession(snap.exists() ? (snap.data() as SessionDoc) : 'missing'),
      () => setSession('missing'),
    );
  }, [claims.sessionId]);

  // Relógio para perceber quando a sessão vence (RN-04: 3 h).
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const open =
    session !== null &&
    session !== 'missing' &&
    session.status === 'open' &&
    (session.expiresAt as Timestamp).toMillis() > nowMs;

  // Dados da dupla (só enquanto a sessão está aberta: as regras exigem).
  useEffect(() => {
    if (!open) return;
    const { db } = getFirebase('student');
    return onSnapshot(
      doc(db, 'classes', claims.classId, 'teams', claims.teamId),
      (snap) => setTeam(snap.exists() ? (snap.data() as TeamDoc) : null),
      () => setTeam(null),
    );
  }, [open, claims.classId, claims.teamId]);

  // Estado da dupla nesta sessão (progresso, dicas, lado).
  // O `lastSeenAt` gravado pelo servidor calibra o relógio local (SPEC 5.2).
  const beatSent = useRef<{ sent: number; done: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    return onSnapshot(
      doc(getFirebase('student').db, 'sessions', claims.sessionId, 'players', claims.teamId),
      (snap) => {
        const data = snap.exists() ? (snap.data() as PlayerDoc) : null;
        setPlayer(data);
        const b = beatSent.current;
        if (data?.lastSeenAt && b && !snap.metadata.hasPendingWrites) {
          calibrate(b.sent, b.done, data.lastSeenAt.toMillis());
          beatSent.current = null;
        }
      },
      () => setPlayer(null),
    );
  }, [open, claims.sessionId, claims.teamId]);

  // Nível da turma define a variante dos desafios e o tamanho mínimo da letra (18 px no nível A).
  useEffect(() => {
    if (!open) return;
    return onSnapshot(doc(getFirebase('student').db, 'classes', claims.classId), (snap) => {
      const lv = (snap.data() as ClassDoc | undefined)?.level ?? null;
      setLevel(lv);
      if (lv) document.documentElement.dataset.level = lv;
    });
  }, [open, claims.classId]);

  // Confronto (cabo de guerra) e dupla rival, em tempo real.
  const matchId = player?.matchId ?? null;
  const [match, setMatch] = useState<MatchDoc | null>(null);
  useEffect(() => {
    if (!open || !matchId) return;
    return onSnapshot(
      doc(getFirebase('student').db, 'sessions', claims.sessionId, 'matches', matchId),
      (snap) => setMatch(snap.exists() ? (snap.data() as MatchDoc) : null),
      () => setMatch(null),
    );
  }, [open, matchId, claims.sessionId]);
  const rivalId =
    match && matchId && player?.side
      ? player.side === 'red'
        ? match.blueTeamId
        : match.redTeamId
      : null;
  const [rival, setRival] = useState<TeamDoc | null>(null);
  useEffect(() => {
    if (!open || !rivalId) return;
    return onSnapshot(
      doc(getFirebase('student').db, 'classes', claims.classId, 'teams', rivalId),
      (snap) => setRival(snap.exists() ? (snap.data() as TeamDoc) : null),
    );
  }, [open, rivalId, claims.classId]);

  // O Robô roda aqui, no navegador da dupla que joga contra ele (SPEC 5.2).
  // RN-07: a Narradora pode adiantar/atrasar só esta dupla.
  const phase = session && session !== 'missing' ? (player?.phaseOverride ?? session.phase) : null;
  const frozen = session !== null && session !== 'missing' && session.freeze?.active === true;
  useNow(1000);
  const sNow = serverNow();
  const eventStartMs =
    session && session !== 'missing' && session.museumEvent?.status !== 'idle'
      ? (session.museumEvent?.startedAt?.toMillis() ?? null)
      : null;
  const eventRunning =
    !!episode && eventStartMs !== null && sNow < eventStartMs + eventDurationMs(episode.event);
  const runMachine = !!(
    matchId &&
    match?.machineSide &&
    !match.winner &&
    level &&
    (phase === 'locks' || phase === 'vault')
  );
  useEffect(() => {
    if (!runMachine || !matchId || !level || !phase) return;
    const tick = () =>
      void machineTick(claims.sessionId, matchId, level, phase, { eventRunning, frozen }).catch(
        () => undefined,
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [runMachine, matchId, level, phase, claims.sessionId, eventRunning, frozen]);

  const episodeId = session && session !== 'missing' ? session.episodeId : null;
  useEffect(() => {
    if (episodeId) void loadEpisode(episodeId).then(setEpisode);
  }, [episodeId]);

  // Presença: avisa que está conectada (o painel da Narradora mostra quem caiu).
  useEffect(() => {
    if (!open) return;
    const ref = doc(
      getFirebase('student').db,
      'sessions',
      claims.sessionId,
      'players',
      claims.teamId,
    );
    const beat = (connected: boolean) => {
      const sent = Date.now();
      return updateDoc(ref, { connected, lastSeenAt: serverTimestamp() })
        .then(() => {
          beatSent.current = { sent, done: Date.now() };
        })
        .catch(() => undefined);
    };
    void beat(true);
    const t = setInterval(() => void beat(true), GAME_RULES.presence.heartbeatSeconds * 1000);
    const bye = () => void beat(false);
    window.addEventListener('pagehide', bye);
    return () => {
      clearInterval(t);
      window.removeEventListener('pagehide', bye);
      bye();
    };
  }, [open, claims.sessionId, claims.teamId]);

  const ctx: GameCtx = {
    sessionId: claims.sessionId,
    classId: claims.classId,
    teamId: claims.teamId,
    episodeId: episodeId ?? '',
  };

  // RN-45: quem está no passo da pista falada recebe a transmissão quando ela acontece.
  const transmissionOn =
    session !== null && session !== 'missing' && session.transmission?.active === true;
  const waitingClue = (() => {
    if (!episode || !player || !level || !player.side || session === null || session === 'missing')
      return false;
    const stage = currentStage(phase ?? session.phase, player.progress);
    if (stage.kind !== 'challenge' || player.progress.heardTransmission) return false;
    return needsTransmission(resolveChallenge(episode, player.side, level, stage.slot));
  })();
  useEffect(() => {
    if (transmissionOn && waitingClue) void markHeardTransmission(ctx).catch(() => undefined);
    // ctx é recriado a cada render; os ids dele já estão em claims
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmissionOn, waitingClue]);

  // Evento do museu (RN-32 a RN-35): só para quem está jogando os cadeados.
  const inEvent =
    eventStartMs !== null &&
    !!player?.side &&
    (phase === 'locks' || phase === 'vault') &&
    player.progress.eventResult === 'pending';
  const jailMs = player?.progress.jailUntil?.toMillis() ?? 0;
  const jailed = jailMs > sNow;

  // RN-25: o ranking da turma só aparece no planejamento e no fim.
  const rankingOn = open && (phase === 'planning' || phase === 'end');
  const classTeams = useStudentClassTeams(claims.classId, rankingOn);
  const endLedger = useSessionLedger(
    claims.classId,
    claims.teamId,
    claims.sessionId,
    open && phase === 'end',
  );
  // Só com a fase da TURMA no fim: é ela que as regras conferem.
  const endPlayers = useEndPlayers(claims.sessionId, open && session.phase === 'end');

  // Trilha por contexto (SPEC 10); silêncio durante transmissão e telas congeladas (RN-45/46).
  const theme: MusicTheme | null =
    !open || transmissionOn || frozen
      ? null
      : phase === 'lobby'
        ? 'lobby'
        : phase === 'planning'
          ? 'planning'
          : phase === 'vault'
            ? 'vault'
            : phase === 'end'
              ? 'end'
              : player?.side === 'blue'
                ? 'blue'
                : player?.side === 'red'
                  ? 'red'
                  : 'planning';
  useEffect(() => {
    setMusic(theme);
  }, [theme]);
  useEffect(() => () => setMusic(null), []);

  if (session === null) return <Waiting text="Conectando ao museu..." />;
  if (!open)
    return <NoSignalScreen detail="A missão desta sessão terminou. Esperem a próxima aula!" />;
  if (!team || !player || !episode || !level)
    return <Waiting text="Buscando a ficha da dupla..." />;

  let screen;
  // A tela de jogo tem o controle de som no rodapé; as outras, flutuando no canto.
  let playing = false;
  const effective = { ...session, phase: phase ?? session.phase };
  if (effective.phase === 'lobby') {
    screen = (
      <LobbyScreen
        team={team}
        episodeTitle={`Ep. ${episode.number} — ${episode.title}`}
        curiosities={episode.curiosities}
      />
    );
  } else if (effective.phase === 'planning') {
    screen = (
      <PlanningScreen
        episode={episode}
        team={team}
        player={player}
        match={matchId ? match : null}
        rival={rivalId ? rival : null}
        classTeams={classTeams}
        teamId={claims.teamId}
        onChooseSide={(s) => chooseSide(ctx, s)}
        onChooseMode={(m) => chooseMode(ctx, m)}
      />
    );
  } else if (effective.phase === 'end') {
    screen = (
      <EndScreen
        episode={episode}
        team={team}
        teamId={claims.teamId}
        player={player}
        match={matchId ? match : null}
        classTeams={classTeams}
        ledger={endLedger}
        sessionPlayers={endPlayers}
      />
    );
  } else if (!player.side || (session.matchesFormed && !player.matchId)) {
    // Chegou atrasada (RN-07): escolhe o lado e entra direto contra a máquina.
    screen = (
      <PlanningScreen
        episode={episode}
        team={team}
        player={player}
        match={null}
        rival={null}
        late
        onChooseSide={(s) => joinLateAgainstMachine(ctx, s)}
        onChooseMode={(m) => chooseMode(ctx, m)}
      />
    );
  } else {
    playing = true;
    screen = (
      <PlayScreen
        ctx={ctx}
        episode={episode}
        level={level}
        session={effective}
        team={team}
        player={player}
        match={matchId ? match : null}
        rival={rivalId ? rival : null}
      />
    );
  }
  return (
    <>
      {screen}
      {!playing && <AudioControls floating />}
      {/* Overlays, do menos para o mais importante (SPEC 9.2, item 7) */}
      <AnimatePresence>
        {jailed && <JailScreen key="jail" untilMs={jailMs} curiosities={episode.curiosities} />}
      </AnimatePresence>
      <AnimatePresence>
        {inEvent && eventStartMs !== null && (
          <MuseumEventOverlay
            key="event"
            event={episode.event}
            startedAtMs={eventStartMs}
            storageKey={`cacada.evento.${claims.sessionId}`}
            onFinish={(answers) => {
              const ok = eventSucceeded(episode.event, answers);
              void finishMuseumEvent(ctx, ok, jailUntilMs(eventStartMs, episode.event))
                .then(() =>
                  addFeed(
                    ctx,
                    ok ? 'event_ok' : 'jail',
                    `${player.side === 'blue' ? team.pirateName : team.cityName} ${ok ? 'desvendou o alarme!' : 'caiu no alarme falso e foi presa.'}`,
                  ),
                )
                .catch(() => undefined);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{transmissionOn && <TransmissionOverlay />}</AnimatePresence>
      <AnimatePresence>
        {frozen && <FreezeOverlay message={session.freeze.message} />}
      </AnimatePresence>
    </>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <HalftoneBackground>
      <div className="grid min-h-screen place-items-center" role="status">
        <Typewriter text={text} speed={40} className="text-2xl text-paper text-glow-spot" />
      </div>
    </HalftoneBackground>
  );
}

import { doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HalftoneBackground } from '@/components/comic';
import { Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { loadEpisode } from '@/content/episodes';
import type { Episode } from '@/content/types';
import { resolveChallenge } from '@/engine/challenges';
import { currentStage, needsTransmission } from '@/engine/progress';
import { chooseSide, markHeardTransmission, type GameCtx } from '@/features/game/actions';
import { EndScreen } from '@/features/game/EndScreen';
import { PlanningScreen } from '@/features/game/PlanningScreen';
import { PlayScreen } from '@/features/game/PlayScreen';
import { TransmissionOverlay } from '@/features/game/TransmissionOverlay';
import { getFirebase } from '@/lib/firebase';
import type { ClassDoc, Level, PlayerDoc, SessionDoc, TeamDoc } from '@/types/domain';
import { LobbyScreen } from './LobbyScreen';
import { NoSignalScreen } from './NoSignalScreen';
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
    const { db } = getFirebase();
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
    const { db } = getFirebase();
    return onSnapshot(
      doc(db, 'classes', claims.classId, 'teams', claims.teamId),
      (snap) => setTeam(snap.exists() ? (snap.data() as TeamDoc) : null),
      () => setTeam(null),
    );
  }, [open, claims.classId, claims.teamId]);

  // Estado da dupla nesta sessão (progresso, dicas, lado).
  useEffect(() => {
    if (!open) return;
    return onSnapshot(
      doc(getFirebase().db, 'sessions', claims.sessionId, 'players', claims.teamId),
      (snap) => setPlayer(snap.exists() ? (snap.data() as PlayerDoc) : null),
      () => setPlayer(null),
    );
  }, [open, claims.sessionId, claims.teamId]);

  // Nível da turma define a variante dos desafios e o tamanho mínimo da letra (18 px no nível A).
  useEffect(() => {
    if (!open) return;
    return onSnapshot(doc(getFirebase().db, 'classes', claims.classId), (snap) => {
      const lv = (snap.data() as ClassDoc | undefined)?.level ?? null;
      setLevel(lv);
      if (lv) document.documentElement.dataset.level = lv;
    });
  }, [open, claims.classId]);

  const episodeId = session && session !== 'missing' ? session.episodeId : null;
  useEffect(() => {
    if (episodeId) void loadEpisode(episodeId).then(setEpisode);
  }, [episodeId]);

  // Presença: avisa que está conectada (o painel da Narradora mostra quem caiu).
  useEffect(() => {
    if (!open) return;
    const ref = doc(getFirebase().db, 'sessions', claims.sessionId, 'players', claims.teamId);
    const beat = (connected: boolean) =>
      updateDoc(ref, { connected, lastSeenAt: serverTimestamp() }).catch(() => undefined);
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
    const stage = currentStage(session.phase, player.progress);
    if (stage.kind !== 'challenge' || player.progress.heardTransmission) return false;
    return needsTransmission(resolveChallenge(episode, player.side, level, stage.slot));
  })();
  useEffect(() => {
    if (transmissionOn && waitingClue) void markHeardTransmission(ctx).catch(() => undefined);
    // ctx é recriado a cada render; os ids dele já estão em claims
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transmissionOn, waitingClue]);

  if (session === null) return <Waiting text="Conectando ao museu..." />;
  if (!open)
    return <NoSignalScreen detail="A missão desta sessão terminou. Esperem a próxima aula!" />;
  if (!team || !player || !episode || !level)
    return <Waiting text="Buscando a ficha da dupla..." />;

  let screen;
  if (session.phase === 'lobby') {
    screen = (
      <LobbyScreen
        team={team}
        episodeTitle={`Ep. ${episode.number} — ${episode.title}`}
        curiosities={episode.curiosities}
      />
    );
  } else if (session.phase === 'planning') {
    screen = (
      <PlanningScreen
        episode={episode}
        team={team}
        player={player}
        onChooseSide={(s) => chooseSide(ctx, s)}
      />
    );
  } else if (session.phase === 'end') {
    screen = <EndScreen episode={episode} team={team} player={player} />;
  } else if (!player.side) {
    // Chegou atrasada (RN-07): escolhe o lado e entra direto nos desafios.
    screen = (
      <PlanningScreen
        episode={episode}
        team={team}
        player={player}
        onChooseSide={(s) => chooseSide(ctx, s)}
      />
    );
  } else {
    screen = (
      <PlayScreen
        ctx={ctx}
        episode={episode}
        level={level}
        session={session}
        team={team}
        player={player}
      />
    );
  }
  return (
    <>
      {screen}
      <AnimatePresence>{transmissionOn && <TransmissionOverlay />}</AnimatePresence>
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

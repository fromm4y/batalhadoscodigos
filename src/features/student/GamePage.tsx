import { doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { HalftoneBackground, SpeechBubble } from '@/components/comic';
import { Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import { loadEpisodeMeta, type EpisodeMeta } from '@/content/episodes';
import { getFirebase } from '@/lib/firebase';
import type { SessionDoc, TeamDoc } from '@/types/domain';
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
  const [episode, setEpisode] = useState<EpisodeMeta | null>(null);

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

  const episodeId = session && session !== 'missing' ? session.episodeId : null;
  useEffect(() => {
    if (episodeId) void loadEpisodeMeta(episodeId).then(setEpisode);
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

  if (session === null) return <Waiting text="Conectando ao museu..." />;
  if (!open)
    return <NoSignalScreen detail="A missão desta sessão terminou. Esperem a próxima aula!" />;
  if (!team) return <Waiting text="Buscando a ficha da dupla..." />;

  if (session.phase === 'lobby') {
    return (
      <LobbyScreen
        team={team}
        episodeTitle={episode ? `Ep. ${episode.number} — ${episode.title}` : '...'}
        curiosities={episode?.curiosities ?? []}
      />
    );
  }
  return (
    <HalftoneBackground>
      <main className="grid min-h-screen place-items-center p-8">
        <SpeechBubble who="narradora" tail="center">
          A fase “{session.phase}” chega nas próximas etapas da construção do jogo. 🛠️
        </SpeechBubble>
      </main>
    </HalftoneBackground>
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

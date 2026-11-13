import { doc, updateDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { SEASON } from '@/content/season';
import { getFirebase } from '@/lib/firebase';
import { useNow } from '@/lib/useNow';
import { useProfile } from '../auth/authStore';
import { useClass, useClassTeams, useSession, useSessionMatches, useSessionPlayers } from '../data';
import { MatchesPanel } from './MatchesPanel';
import { InstructorLayout } from '../InstructorLayout';
import { isOnline } from '../presence';
import { SessionControls } from './SessionControls';

const PHASE_LABEL = {
  lobby: 'Lobby (entrada das duplas)',
  planning: 'Planejamento',
  locks: 'Cadeados',
  vault: 'Cofre',
  end: 'Fim do episódio',
} as const;

/**
 * `/instrutor/sessao/:sessionId` — versão da Etapa 2: código, duplas conectadas, projetor e encerrar.
 * O Painel da Narradora completo (fases, eventos, transmissões...) chega na Etapa 5.
 */
export function SessionPage() {
  const { sessionId = '' } = useParams();
  const profile = useProfile()!;
  const session = useSession(sessionId);
  const cls = useClass(session.data?.classId ?? null);
  const teams = useClassTeams(session.data?.classId ?? null);
  const players = useSessionPlayers(sessionId);
  const matches = useSessionMatches(sessionId);
  const now = useNow(5000);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.loading) return <InstructorLayout title="Sessão">{null}</InstructorLayout>;
  const s = session.data;
  if (!s && session.error) {
    return (
      <InstructorLayout title="Sem acesso à sessão">
        <p
          role="alert"
          className="mb-4 max-w-2xl border-l-4 border-bando bg-bando/20 p-3 font-bold text-paper"
        >
          O banco recusou a leitura desta sessão. Confira se o arquivo firestore.rules mais recente
          foi publicado no Firebase (Firestore → Regras) e recarregue a página.
        </p>
        <Link to="/instrutor/turmas" className="font-bold text-brass underline">
          ← Voltar para as turmas
        </Link>
      </InstructorLayout>
    );
  }
  if (!s) {
    return (
      <InstructorLayout title="Sessão não encontrada">
        <Link to="/instrutor/turmas" className="font-bold text-brass underline">
          ← Voltar para as turmas
        </Link>
      </InstructorLayout>
    );
  }

  const finished = s.status === 'finished' || s.expiresAt.toMillis() <= now;
  const episode = SEASON.find((e) => e.id === s.episodeId);
  const teamById = new Map(teams.data.map((t) => [t.id, t]));
  const joined = players.data
    .map((p) => ({ p, t: teamById.get(p.teamId) }))
    .filter((x): x is { p: (typeof players.data)[number]; t: NonNullable<typeof x.t> } => !!x.t)
    .sort((a, b) => a.t.cityName.localeCompare(b.t.cityName));
  const onlineCount = joined.filter(({ p }) =>
    isOnline(p.connected, p.lastSeenAt?.toMillis() ?? null, now),
  ).length;
  const mine = s.instructorId === profile.uid;

  async function endSession() {
    setConfirmEnd(false);
    try {
      await updateDoc(doc(getFirebase().db, 'sessions', sessionId), { status: 'finished' });
    } catch (err) {
      console.error('[sessao]', err);
      setError('Não consegui encerrar a sessão. Tente de novo.');
    }
  }

  return (
    <InstructorLayout title={`Sessão · ${cls.data?.name ?? ''}`}>
      {error && (
        <p
          role="alert"
          className="mb-4 border-l-4 border-bando bg-bando/20 p-3 font-bold text-paper"
        >
          {error}
        </p>
      )}
      <div className="grid grid-cols-[1fr_1.4fr] gap-8">
        <div className="flex flex-col gap-6">
          <ComicPanel
            caption={finished ? 'Sessão encerrada' : 'Código da sessão'}
            tone={finished ? 'graphite' : 'red'}
            glow={finished ? 'none' : 'red'}
            className="pt-8 text-center"
          >
            <p
              className={cn(
                'font-heist text-[7rem] leading-none tracking-[0.2em]',
                finished ? 'text-mist line-through' : 'text-paper',
              )}
            >
              {s.code}
            </p>
            <p className="font-type">
              {episode ? `Ep. ${episode.number} — ${episode.title}` : s.episodeId} · fase:{' '}
              {PHASE_LABEL[s.phase]}
            </p>
          </ComicPanel>
          {!finished && mine && (
            <div className="flex flex-col gap-3">
              <ComicButton
                variant="brass"
                size="lg"
                icon="📽️"
                onClick={() => window.open(`/projetor/${sessionId}`, '_blank')}
              >
                Abrir tela do projetor
              </ComicButton>
              <ComicButton variant="graphite" icon="⏹" onClick={() => setConfirmEnd(true)}>
                Encerrar sessão
              </ComicButton>
            </div>
          )}
          {!finished && mine && (
            <SessionControls
              sessionId={sessionId}
              session={s}
              level={cls.data?.level ?? null}
              players={players.data}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <ComicPanel
            caption={`Duplas na sessão · ${onlineCount} conectadas`}
            tone="graphite"
            className="pt-8"
          >
            {joined.length === 0 ? (
              <p className="font-type text-mist">
                Ninguém entrou ainda. Mostre o código no projetor!
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3">
                {joined.map(({ p, t }) => {
                  const online = isOnline(p.connected, p.lastSeenAt?.toMillis() ?? null, now);
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-md border-2 border-graphite-light bg-night/60 p-2"
                    >
                      <Avatar avatar={t.avatar} className="h-14 w-12" decorative />
                      <div className="flex-1">
                        <p className="font-heist text-xl leading-none tracking-wider">
                          {t.cityName}
                        </p>
                        <p className="text-sm text-mist">
                          {p.side === 'red'
                            ? '🎭 Bando'
                            : p.side === 'blue'
                              ? '⚓ Piratas'
                              : 'sem lado'}
                          {' · '}
                          {p.progress.vaultSolvedAt
                            ? 'Cofre ✔'
                            : `${p.progress.lockIndex}/3 cadeados`}
                          {' · '}
                          {p.episodePoints} pts
                        </p>
                      </div>
                      <span
                        className={cn(
                          'border-2 border-ink px-2 pt-0.5 font-heist text-base tracking-wider',
                          online ? 'bg-success text-ink' : 'bg-graphite-light text-mist',
                        )}
                      >
                        {online ? '● on-line' : '○ desconectada'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </ComicPanel>
          <MatchesPanel matches={matches.data} teams={teams.data} />
        </div>
      </div>

      <AnimatePresence>
        {confirmEnd && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="end-title"
              className="max-w-md rounded-sm border-[3px] border-ink bg-aged p-6 text-ink shadow-comic"
            >
              <h2 id="end-title" className="font-type text-xl uppercase">
                Encerrar a sessão {s.code}?
              </h2>
              <p className="mt-2">As duplas saem do jogo e o código para de funcionar.</p>
              <div className="mt-5 flex justify-end gap-3">
                <ComicButton variant="paper" onClick={() => setConfirmEnd(false)}>
                  Cancelar
                </ComicButton>
                <ComicButton variant="red" icon="⏹" onClick={() => void endSession()}>
                  Encerrar
                </ComicButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </InstructorLayout>
  );
}

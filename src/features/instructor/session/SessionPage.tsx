import { doc, updateDoc } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { SEASON } from '@/content/season';
import { getFirebase } from '@/lib/firebase';
import { useNow } from '@/lib/useNow';
import { useProfile } from '../auth/authStore';
import { useClass, useClassTeams, useSession, useSessionMatches, useSessionPlayers } from '../data';
import { MatchesPanel } from './MatchesPanel';
import { EventFreezePanel, FeedPanel, HelpPanel, ScriptPanel } from './LivePanels';
import { TeamActionsDialog } from './TeamActionsDialog';
import { loadEpisode } from '@/content/episodes';
import type { Episode } from '@/content/types';
import { resolveChallenge } from '@/engine/challenges';
import { activeEffects } from '@/engine/match';
import { currentStage, needsTransmission } from '@/engine/progress';
import type { Level, MatchDoc, PlayerDoc, SessionDoc } from '@/types/domain';
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
 * `/instrutor/sessao/:sessionId` — Painel da Narradora (SPEC 9.3): código, fases, confrontos,
 * evento do museu, transmissão, congelar telas, roteiro, duplas com status e ações, chamados e feed.
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
  const [selected, setSelected] = useState<string | null>(null);
  const [epContent, setEpContent] = useState<Episode | null>(null);
  const episodeId = session.data?.episodeId ?? null;
  useEffect(() => {
    if (episodeId) void loadEpisode(episodeId).then(setEpContent);
  }, [episodeId]);

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
            <>
              <SessionControls
                sessionId={sessionId}
                session={s}
                level={cls.data?.level ?? null}
                players={players.data}
              />
              <EventFreezePanel sessionId={sessionId} session={s} episode={epContent} />
            </>
          )}
          <ScriptPanel episode={epContent} level={cls.data?.level ?? null} />
        </div>

        <div className="flex flex-col gap-6">
          {mine && <HelpPanel sessionId={sessionId} teams={teams.data} />}
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
                  const flags = teamFlags(
                    p,
                    matches.data,
                    epContent,
                    cls.data?.level ?? null,
                    s,
                    now,
                  );
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => mine && setSelected(t.id)}
                        title={mine ? 'Ações desta dupla' : undefined}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-graphite-light bg-night/60 p-2 text-left hover:border-brass"
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
                      </button>
                      {flags.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-1">
                          {flags.map((f) => (
                            <span
                              key={f}
                              className="rounded-sm bg-alert/25 px-1.5 font-type text-xs text-paper"
                            >
                              {f}
                            </span>
                          ))}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </ComicPanel>
          <MatchesPanel matches={matches.data} teams={teams.data} />
          {mine && <FeedPanel sessionId={sessionId} />}
        </div>
      </div>

      {selected &&
        (() => {
          const t = teams.data.find((x) => x.id === selected);
          const p = players.data.find((x) => x.teamId === selected);
          return t && p ? (
            <TeamActionsDialog
              ctx={{ sessionId, session: s, uid: profile.uid }}
              team={t}
              player={p}
              episode={epContent}
              level={cls.data?.level ?? null}
              onClose={() => setSelected(null)}
            />
          ) : null;
        })()}
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

/** Status da dupla para o painel (SPEC 9.3): presa, congelada, aguardando transmissão, fase própria. */
function teamFlags(
  p: PlayerDoc,
  matches: (MatchDoc & { id: string })[],
  ep: Episode | null,
  level: Level | null,
  s: SessionDoc,
  now: number,
): string[] {
  const flags: string[] = [];
  if ((p.progress.jailUntil?.toMillis() ?? 0) > now) flags.push('🔒 presa');
  const m = p.matchId ? matches.find((x) => x.id === p.matchId) : null;
  if (
    m &&
    p.side &&
    activeEffects(m.effects, now).some((e) => e.kind === 'freeze' && e.target === p.side)
  ) {
    flags.push('📡 tela chiando');
  }
  const phase = p.phaseOverride ?? s.phase;
  if (p.phaseOverride) flags.push(`⏩ fase própria: ${p.phaseOverride}`);
  if (ep && level && p.side && !p.progress.heardTransmission) {
    const st = currentStage(phase, p.progress);
    if (
      st.kind === 'challenge' &&
      needsTransmission(resolveChallenge(ep, p.side, level, st.slot))
    ) {
      flags.push('🎧 aguardando transmissão');
    }
  }
  if (p.helpUsed) flags.push('🙋 pediu ajuda');
  return flags;
}

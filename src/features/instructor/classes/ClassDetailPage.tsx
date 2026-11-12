import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, ComicPanel, SpeechBubble, cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';
import { SEASON } from '@/content/season';
import { postAsInstructor } from '@/lib/api';
import type { TeamDoc } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import { useClass, useClassTeams, useOpenSessions, useSchools, type WithId } from '../data';
import { InstructorLayout } from '../InstructorLayout';

/** `/instrutor/turmas/:classId` — duplas (avatares, pontos, reset de PIN) + ranking + "Abrir sessão". */
export function ClassDetailPage() {
  const { classId = '' } = useParams();
  const profile = useProfile()!;
  const navigate = useNavigate();
  const cls = useClass(classId);
  const teams = useClassTeams(classId);
  const schools = useSchools();
  const openSessions = useOpenSessions(profile.uid, classId);

  const available = SEASON.filter((e) => e.available);
  const [episodeId, setEpisodeId] = useState(available[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [resetting, setResetting] = useState<WithId<TeamDoc> | null>(null);
  const [now] = useState(() => Date.now());

  if (cls.loading) return <InstructorLayout title="Turma">{null}</InstructorLayout>;
  if (!cls.data) {
    return (
      <InstructorLayout title="Turma não encontrada">
        <Link to="/instrutor/turmas" className="font-bold text-brass underline">
          ← Voltar para as turmas
        </Link>
      </InstructorLayout>
    );
  }

  const c = cls.data;
  const mine = c.instructorId === profile.uid;
  const schoolName = schools.data.find((s) => s.id === c.schoolId)?.name ?? '';
  const ranking = [...teams.data].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.cityName.localeCompare(b.cityName),
  );
  const open = openSessions.data.find((s) => s.expiresAt && s.expiresAt.toMillis() > now) ?? null;

  async function openSession() {
    setBusy(true);
    setMsg(null);
    const r = await postAsInstructor<{ sessionId: string; code: string }>('/api/session-open', {
      classId,
      episodeId,
    });
    setBusy(false);
    if (r.ok) navigate(`/instrutor/sessao/${r.sessionId}`);
    else setMsg({ kind: 'error', text: r.error });
  }

  async function resetPin(team: WithId<TeamDoc>) {
    setResetting(null);
    const r = await postAsInstructor('/api/team-reset-pin', { classId, teamId: team.id });
    setMsg(
      r.ok
        ? {
            kind: 'ok',
            text: `PIN de ${team.cityName} apagado. No próximo login, a dupla cria um novo.`,
          }
        : { kind: 'error', text: r.error },
    );
  }

  return (
    <InstructorLayout title={`Turma ${c.name}`}>
      <p className="-mt-4 mb-6 font-type text-mist">
        {schoolName} · {c.grade}º ano · {c.shift === 'manha' ? 'manhã' : 'tarde'} · nível {c.level}{' '}
        · temporada {c.season}
        {!mine && ' · (somente leitura)'}
      </p>

      {msg && (
        <p
          role={msg.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'mb-6 border-l-4 p-3 font-bold text-paper',
            msg.kind === 'ok' ? 'border-success bg-success/15' : 'border-bando bg-bando/20',
          )}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-[1.5fr_1fr] gap-8">
        <div className="flex flex-col gap-8">
          {mine && (
            <ComicPanel
              caption="Sessão de hoje"
              tone={open ? 'red' : 'graphite'}
              glow={open ? 'red' : 'none'}
              className="pt-8"
            >
              {open ? (
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="font-type text-sm uppercase">Sessão aberta · código</p>
                    <p className="font-heist text-7xl leading-none tracking-[0.2em] text-paper">
                      {open.code}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <ComicButton
                      variant="brass"
                      icon="🎛️"
                      onClick={() => navigate(`/instrutor/sessao/${open.id}`)}
                    >
                      Ir para a sessão
                    </ComicButton>
                    <ComicButton
                      variant="graphite"
                      icon="📽️"
                      onClick={() => window.open(`/projetor/${open.id}`, '_blank')}
                    >
                      Abrir projetor
                    </ComicButton>
                  </div>
                </div>
              ) : c.archived ? (
                <p className="font-type text-mist">Turma arquivada. Reative para abrir sessões.</p>
              ) : (
                <div className="flex flex-wrap items-end gap-4">
                  <label className="grid flex-1 gap-1">
                    <span className="font-type text-sm text-mist uppercase">Episódio</span>
                    <select
                      value={episodeId}
                      onChange={(e) => setEpisodeId(e.target.value)}
                      className="min-h-11 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold text-ink"
                    >
                      {SEASON.map((e) => (
                        <option key={e.id} value={e.id} disabled={!e.available}>
                          Ep. {e.number} — {e.title}
                          {e.available ? '' : ' (em breve)'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ComicButton
                    variant="red"
                    size="lg"
                    icon="🚨"
                    disabled={busy || !episodeId}
                    onClick={() => void openSession()}
                  >
                    {busy ? 'Abrindo...' : 'Abrir sessão'}
                  </ComicButton>
                </div>
              )}
            </ComicPanel>
          )}

          <section>
            <h2 className="mb-3 font-heist text-3xl tracking-wider text-paper">
              Duplas ({teams.data.length}/{GAME_RULES.maxTeamsPerClass})
            </h2>
            {teams.data.length === 0 ? (
              <SpeechBubble who="narradora" tail="left">
                Nenhuma dupla ainda. Elas se cadastram sozinhas quando você abrir a primeira sessão!
              </SpeechBubble>
            ) : (
              <ul className="grid grid-cols-3 gap-4">
                {teams.data.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col items-center gap-1 rounded-hand border-4 border-ink bg-graphite-dots p-3 shadow-comic"
                  >
                    <Avatar
                      avatar={t.avatar}
                      className="h-24 w-20"
                      title={`Avatar de ${t.cityName}`}
                    />
                    <p className="font-heist text-2xl leading-none tracking-wider text-bando">
                      {t.cityName}
                    </p>
                    <p className="font-heist text-lg leading-none tracking-wide text-piratas">
                      {t.pirateName}
                    </p>
                    <p className="font-type text-sm text-mist">
                      {t.totalPoints} pts · {t.episodesPlayed} ep.
                    </p>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => setResetting(t)}
                        className="mt-1 min-h-11 cursor-pointer border-2 border-mist/60 px-3 pt-1 font-heist text-lg tracking-wider text-mist hover:border-paper hover:text-paper"
                      >
                        🔑 Resetar PIN
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <ComicPanel caption="Ranking da temporada" tone="graphite" className="self-start pt-8">
          {ranking.length === 0 ? (
            <p className="font-type text-mist">O ranking aparece quando as duplas pontuarem.</p>
          ) : (
            <ol className="grid gap-2">
              {ranking.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink font-heist text-2xl',
                      i === 0
                        ? 'bg-brass text-ink glow-brass'
                        : i === 1
                          ? 'bg-mist text-ink'
                          : i === 2
                            ? 'bg-[#b87333] text-ink'
                            : 'bg-graphite-light text-paper',
                    )}
                  >
                    {i + 1}
                  </span>
                  <Avatar avatar={t.avatar} className="h-10 w-9" decorative />
                  <span className="flex-1 font-bold">{t.cityName}</span>
                  <span className="font-heist text-2xl tracking-wider text-brass">
                    {t.totalPoints}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </ComicPanel>
      </div>

      <AnimatePresence>
        {resetting && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="reset-title"
              className="max-w-md rounded-sm border-[3px] border-ink bg-aged p-6 text-ink shadow-comic"
            >
              <h2 id="reset-title" className="font-type text-xl uppercase">
                Resetar o PIN de {resetting.cityName}?
              </h2>
              <p className="mt-2">
                O PIN antigo deixa de funcionar. No próximo login, a dupla cria um PIN novo.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <ComicButton variant="paper" onClick={() => setResetting(null)}>
                  Cancelar
                </ComicButton>
                <ComicButton variant="red" icon="🔑" onClick={() => void resetPin(resetting)}>
                  Resetar
                </ComicButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </InstructorLayout>
  );
}

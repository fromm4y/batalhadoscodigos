import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, ComicPanel, SpeechBubble, cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';
import { SEASON } from '@/content/season';
import { doc, updateDoc } from 'firebase/firestore';
import { postAsInstructor } from '@/lib/api';
import { getFirebase } from '@/lib/firebase';
import type { TeamDoc } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import { useClass, useClassTeams, useOpenSessions, useSchools, type WithId } from '../data';
import { InstructorLayout } from '../InstructorLayout';
import { SeasonCloseDialog } from '../lifecycle/SeasonCloseDialog';
import { StatCards } from '../StatCards';

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
  // 17/11: retomar o mesmo episódio de onde cada dupla parou na aula anterior
  const [resume, setResume] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [resetting, setResetting] = useState<WithId<TeamDoc> | null>(null);
  const [now] = useState(() => Date.now());
  const [closing, setClosing] = useState(false);

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
  // Turma arquivada é somente leitura (SPEC-02 A2); a dona ou a admin podem desarquivar.
  const canManage = mine || profile.role === 'admin';
  const active = mine && !c.archived;

  async function toggleArchive() {
    setMsg(null);
    try {
      await updateDoc(doc(getFirebase().db, 'classes', classId), { archived: !c.archived });
      setMsg({
        kind: 'ok',
        text: c.archived ? 'Turma reativada.' : 'Turma arquivada (somente leitura).',
      });
    } catch (err) {
      console.error('[turma]', err);
      setMsg({ kind: 'error', text: 'Não consegui atualizar a turma. Tente de novo.' });
    }
  }
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
      resume,
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
      {c.archived && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-brass bg-brass/15 p-3">
          <p className="font-bold text-paper">
            🗄️ Turma arquivada: somente leitura, sem abrir sessão
            {c.seasonClosedAt ? ' (temporada encerrada: duplas e pontos foram apagados)' : ''}.
          </p>
          {canManage && (
            <ComicButton variant="brass" icon="↺" onClick={() => void toggleArchive()}>
              Desarquivar
            </ComicButton>
          )}
        </div>
      )}

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

      <StatCards
        className="mb-8"
        stats={[
          {
            icon: '👥',
            label: 'Duplas',
            value: `${teams.data.length}/${GAME_RULES.maxTeamsPerClass}`,
          },
          {
            icon: '🪙',
            label: 'Pontos da turma',
            value: teams.data.reduce((sum, t) => sum + t.totalPoints, 0),
            tone: 'red',
          },
          {
            icon: '🎬',
            label: 'Episódios jogados',
            value: Math.max(0, ...teams.data.map((t) => t.episodesPlayed)),
            tone: 'blue',
          },
          { icon: '🎚️', label: 'Nível', value: c.level, tone: 'green' },
        ]}
      />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-8">
          {active && (
            <ComicPanel
              caption="Sessão de hoje"
              tone={open ? 'red' : 'graphite'}
              glow={open ? 'red' : 'none'}
              className="pt-8"
            >
              {open ? (
                <div className="flex flex-wrap items-center justify-between gap-6">
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
                  <label className="grid min-w-0 basis-full gap-1 sm:flex-1 sm:basis-auto">
                    <span className="font-type text-sm text-mist uppercase">Episódio</span>
                    <select
                      value={episodeId}
                      onChange={(e) => setEpisodeId(e.target.value)}
                      className="min-h-11 w-full min-w-0 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold text-ink"
                    >
                      {SEASON.map((e) => (
                        <option key={e.id} value={e.id} disabled={!e.available}>
                          Ep. {e.number} — {e.title}
                          {e.available ? '' : ' (em breve)'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-h-11 basis-full cursor-pointer items-center gap-2 font-body text-base text-paper">
                    <input
                      type="checkbox"
                      checked={resume}
                      onChange={(e) => setResume(e.target.checked)}
                      className="h-5 w-5 accent-[#D4A537]"
                    />
                    ▶️ Continuar de onde pararam (cada dupla volta ao cadeado e à etapa da última
                    aula deste episódio; os confrontos são formados de novo)
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
                  <a
                    href={`/instrutor/roteiro/${episodeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid min-h-11 place-items-center border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider text-ink hover:glow-brass"
                  >
                    📜 Roteiro deste episódio
                  </a>
                  <a
                    href={`/instrutor/turmas/${classId}/certificados/${episodeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid min-h-11 place-items-center border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider text-ink hover:glow-brass"
                  >
                    🎓 Certificados deste episódio
                  </a>
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
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
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
                    {active && (
                      <button
                        type="button"
                        onClick={() => setResetting(t)}
                        title="Apaga o PIN: no próximo login a dupla cria um novo"
                        className="mt-1 min-h-11 cursor-pointer px-2 pt-1 font-heist text-base tracking-wider text-mist underline decoration-dotted underline-offset-4 hover:text-paper"
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

        <div className="flex flex-col gap-8 self-start">
          <ComicPanel caption="Ranking da temporada" tone="graphite" className="pt-8">
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
          {canManage && !c.archived && (
            <ComicPanel caption="Fim de ano" tone="graphite" className="pt-8">
              <p className="mb-3 font-type text-mist">
                Arquivar deixa a turma somente leitura (dá para desfazer). Encerrar a temporada
                guarda o ranking e apaga duplas, pontos e sessões (LGPD), sem volta.
              </p>
              <div className="flex flex-wrap gap-2">
                <ComicButton variant="paper" icon="🗄️" onClick={() => void toggleArchive()}>
                  Arquivar turma
                </ComicButton>
                <ComicButton variant="red" icon="🏁" onClick={() => setClosing(true)}>
                  Encerrar temporada
                </ComicButton>
              </div>
            </ComicPanel>
          )}
        </div>
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
      {closing && (
        <SeasonCloseDialog
          classId={classId}
          cls={c}
          schoolName={schoolName}
          teams={teams.data}
          onClose={(done) => {
            setClosing(false);
            if (done) setMsg({ kind: 'ok', text: done });
          }}
        />
      )}
    </InstructorLayout>
  );
}

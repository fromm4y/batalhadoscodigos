import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { CleanupPanel } from '../lifecycle/CleanupPanel';
import { SeasonOrderPanel } from './SeasonOrderPanel';
import { useState } from 'react';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { getFirebase } from '@/lib/firebase';
import { isValidEmail, normalizeEmail } from '@/lib/email';
import type { Role } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import { useAllClasses, useAllowlist, useSchools } from '../data';
import { StatCards } from '../StatCards';
import { useSeasonOrder } from '@/features/game/useEpisodeHook';
import { InstructorLayout } from '../InstructorLayout';

const ROLE_LABEL: Record<Role, string> = { admin: 'Administradora', instructor: 'Narradora' };

/** /admin — allowlist de instrutoras e escolas (SPEC 9.1). */
export function AdminPage() {
  const profile = useProfile()!;
  const allowlist = useAllowlist(true);
  const schools = useSchools();
  const classes = useAllClasses(true);
  const order = useSeasonOrder('instructor');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('instructor');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const db = () => getFirebase().db;
  const sorted = [...allowlist.data].sort(
    (a, b) => Number(b.active) - Number(a.active) || a.email.localeCompare(b.email),
  );

  async function add() {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setFeedback({ kind: 'error', text: 'Esse e-mail parece incompleto.' });
      return;
    }
    const existing = allowlist.data.find((a) => a.id === normalized);
    setBusy(true);
    setFeedback(null);
    try {
      if (existing) {
        await updateDoc(doc(db(), 'allowedInstructors', normalized), { active: true, role });
        setFeedback({ kind: 'ok', text: `${normalized} reativado(a) como ${ROLE_LABEL[role]}.` });
      } else {
        await setDoc(doc(db(), 'allowedInstructors', normalized), {
          email: normalized,
          role,
          active: true,
          addedBy: profile.email,
          addedAt: serverTimestamp(),
        });
        setFeedback({
          kind: 'ok',
          text: `${normalized} já pode entrar como ${ROLE_LABEL[role]}! 🎉`,
        });
      }
      setEmail('');
      setRole('instructor');
    } catch (err) {
      console.error('[admin]', err);
      setFeedback({ kind: 'error', text: 'Não consegui salvar. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, patch: { active?: boolean; role?: Role }) {
    setFeedback(null);
    try {
      await updateDoc(doc(db(), 'allowedInstructors', id), patch);
    } catch (err) {
      console.error('[admin]', err);
      setFeedback({ kind: 'error', text: 'Não consegui atualizar esse acesso.' });
    }
  }

  async function toggleSchool(id: string, active: boolean) {
    try {
      await updateDoc(doc(db(), 'schools', id), { active });
    } catch (err) {
      console.error('[admin]', err);
      setFeedback({ kind: 'error', text: 'Não consegui atualizar a escola.' });
    }
  }

  return (
    <InstructorLayout title="Administração">
      <StatCards
        className="mb-8"
        stats={[
          {
            icon: '🎙️',
            label: 'Narradoras ativas',
            value: allowlist.data.filter((a) => a.active).length,
          },
          {
            icon: '🏫',
            label: 'Escolas ativas',
            value: `${schools.data.filter((x) => x.active).length}/${schools.data.length}`,
            tone: 'blue',
          },
          {
            icon: '🗂️',
            label: 'Turmas ativas',
            value: classes.data.filter((c) => !c.archived).length,
            tone: 'red',
          },
          {
            icon: '🗓️',
            label: 'Temporada',
            value: order === 'long' ? 'Longa · 5 ep.' : 'Curta · 4 ep.',
            tone: 'green',
          },
        ]}
      />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ComicPanel caption="Quem pode ser Narradora" tone="graphite" className="pt-8">
          <form
            className="mb-5 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
          >
            <label className="grid flex-1 gap-1">
              <span className="font-type text-sm text-mist uppercase">E-mail Google</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@escola.sp.gov.br"
                className="min-h-11 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold text-ink"
              />
            </label>
            <label className="grid gap-1">
              <span className="font-type text-sm text-mist uppercase">Papel</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="min-h-11 border-[3px] border-ink bg-paper px-3 font-body text-lg font-bold text-ink"
              >
                <option value="instructor">Narradora</option>
                <option value="admin">Administradora</option>
              </select>
            </label>
            <ComicButton type="submit" variant="brass" icon="＋" disabled={busy || !email.trim()}>
              Autorizar
            </ComicButton>
          </form>

          {feedback && (
            <p
              role={feedback.kind === 'error' ? 'alert' : 'status'}
              className={cn(
                'mb-4 border-l-4 p-2 font-bold',
                feedback.kind === 'ok'
                  ? 'border-success bg-success/15 text-paper'
                  : 'border-bando bg-bando/20 text-paper',
              )}
            >
              {feedback.text}
            </p>
          )}

          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Acessos autorizados</caption>
            <thead>
              <tr className="border-b-2 border-graphite-light font-type text-sm text-mist uppercase">
                <th className="py-2">E-mail</th>
                <th className="py-2">Papel</th>
                <th className="py-2">Situação</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const self = a.id === profile.email;
                return (
                  <tr
                    key={a.id}
                    className={cn('border-b border-graphite-light', !a.active && 'opacity-55')}
                  >
                    <td className="py-2 pr-3 font-bold break-all">
                      {a.email}{' '}
                      {self && <span className="font-type text-xs text-brass">(você)</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={a.role}
                        disabled={self}
                        aria-label={`Papel de ${a.email}`}
                        onChange={(e) => void update(a.id, { role: e.target.value as Role })}
                        className="min-h-11 border-2 border-ink bg-graphite-light px-2 font-bold text-paper disabled:opacity-60"
                      >
                        <option value="instructor">Narradora</option>
                        <option value="admin">Administradora</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        disabled={self}
                        onClick={() => void update(a.id, { active: !a.active })}
                        className={cn(
                          'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider disabled:cursor-not-allowed disabled:opacity-60',
                          a.active ? 'bg-success text-ink' : 'bg-graphite-light text-paper',
                        )}
                        title={self ? 'Você não pode desativar o próprio acesso' : undefined}
                      >
                        {a.active ? '✔ Ativa' : '✖ Desativada'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ComicPanel>

        <div className="flex flex-col gap-8">
          <SeasonOrderPanel uid={profile.uid} />
          <CleanupPanel isAdmin />
          <p className="font-type text-sm text-mist">
            🏁 Para arquivar uma turma ou encerrar a temporada dela, abra a página da turma.
          </p>
        </div>
      </div>

      <ComicPanel
        caption={`Escolas (${schools.data.length})`}
        tone="graphite"
        className="mt-8 pt-8"
      >
        <p className="mb-3 font-type text-sm text-mist">
          Escola inativa some da lista ao criar turma (as turmas que já existem continuam).
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {[...schools.data]
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map((x) => (
              <li
                key={x.id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-sm border-2 px-3 py-1',
                  x.active
                    ? 'border-success/50 bg-success/10'
                    : 'border-graphite-light bg-night/40',
                )}
              >
                <span
                  className={cn(
                    'min-w-0 text-sm font-bold',
                    !x.active && 'line-through opacity-60',
                  )}
                >
                  {x.name}
                </span>
                <button
                  type="button"
                  aria-pressed={x.active}
                  aria-label={`${x.name}: ${x.active ? 'ativa (clique para desativar)' : 'inativa (clique para ativar)'}`}
                  onClick={() => void toggleSchool(x.id, !x.active)}
                  className={cn(
                    'min-h-11 min-w-11 shrink-0 cursor-pointer border-[3px] border-ink px-2 pt-1 font-heist text-base tracking-wider',
                    x.active ? 'bg-success text-ink' : 'bg-graphite-light text-paper',
                  )}
                >
                  {x.active ? '✔' : '✖'}
                </button>
              </li>
            ))}
        </ul>
        {schools.data.length === 0 && !schools.loading && (
          <p className="font-type text-mist">Nenhuma escola. Abra /api/setup uma vez.</p>
        )}
      </ComicPanel>
    </InstructorLayout>
  );
}

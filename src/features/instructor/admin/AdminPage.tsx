import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { getFirebase } from '@/lib/firebase';
import { isValidEmail, normalizeEmail } from '@/lib/email';
import type { Role } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import { useAllowlist, useSchools } from '../data';
import { InstructorLayout } from '../InstructorLayout';

const ROLE_LABEL: Record<Role, string> = { admin: 'Administradora', instructor: 'Narradora' };

/** /admin — allowlist de instrutoras e escolas (SPEC 9.1). */
export function AdminPage() {
  const profile = useProfile()!;
  const allowlist = useAllowlist(true);
  const schools = useSchools();
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
      <div className="grid grid-cols-[1.6fr_1fr] gap-8">
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
          <ComicPanel caption="Escolas" tone="graphite" className="pt-8">
            <ul className="grid gap-2">
              {[...schools.data]
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className={cn('font-bold', !s.active && 'line-through opacity-60')}>
                      {s.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleSchool(s.id, !s.active)}
                      className={cn(
                        'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
                        s.active ? 'bg-success text-ink' : 'bg-graphite-light text-paper',
                      )}
                    >
                      {s.active ? '✔ Ativa' : '✖ Inativa'}
                    </button>
                  </li>
                ))}
            </ul>
            {schools.data.length === 0 && !schools.loading && (
              <p className="font-type text-mist">Nenhuma escola. Abra /api/setup uma vez.</p>
            )}
          </ComicPanel>
          <ComicPanel caption="Fim de temporada" tone="graphite" className="pt-8">
            <p className="font-type text-mist">
              Arquivar turmas e apagar sessões antigas (LGPD) chega numa próxima etapa.
            </p>
          </ComicPanel>
        </div>
      </div>
    </InstructorLayout>
  );
}

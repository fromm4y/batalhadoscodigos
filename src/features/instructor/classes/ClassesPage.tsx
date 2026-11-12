import { doc, updateDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { ComicButton, SpeechBubble } from '@/components/comic';
import { getFirebase } from '@/lib/firebase';
import type { ClassDoc } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import { useAllClasses, useInstructors, useMyClasses, useSchools, type WithId } from '../data';
import { InstructorLayout } from '../InstructorLayout';
import { ClassCard } from './ClassCard';
import { ClassFormDialog } from './ClassFormDialog';

function byName(a: WithId<ClassDoc>, b: WithId<ClassDoc>) {
  return a.name.localeCompare(b.name, 'pt-BR', { numeric: true });
}

/** /instrutor/turmas — CRUD das próprias turmas (RN-01) + visão de leitura da admin. */
export function ClassesPage() {
  const profile = useProfile()!;
  const isAdmin = profile.role === 'admin';
  const schools = useSchools();
  const mine = useMyClasses(profile.uid);
  const all = useAllClasses(isAdmin);
  const instructors = useInstructors(isAdmin);

  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WithId<ClassDoc> | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const schoolName = useMemo(() => {
    const map = new Map(schools.data.map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? 'Escola?';
  }, [schools.data]);

  const myVisible = mine.data.filter((c) => showArchived || !c.archived).sort(byName);
  const archivedCount = mine.data.filter((c) => c.archived).length;
  const others = all.data.filter((c) => c.instructorId !== profile.uid && !c.archived).sort(byName);
  const ownerLabel = (uid: string) => {
    const i = instructors.data.find((x) => x.id === uid);
    return i ? `${i.displayName} (${i.email})` : 'Narradora';
  };

  async function toggleArchive(c: WithId<ClassDoc>) {
    setActionError(null);
    try {
      await updateDoc(doc(getFirebase().db, 'classes', c.id), { archived: !c.archived });
    } catch (err) {
      console.error('[turma]', err);
      setActionError('Não consegui atualizar a turma. Tente de novo.');
    }
  }

  return (
    <InstructorLayout title="Minhas turmas">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <ComicButton
          variant="red"
          size="lg"
          icon="＋"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
          disabled={schools.loading}
        >
          Nova turma
        </ComicButton>
        {archivedCount > 0 && (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 font-bold text-paper">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-5 w-5 accent-brass"
            />
            Mostrar arquivadas ({archivedCount})
          </label>
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mb-4 border-l-4 border-bando bg-bando/20 p-3 font-bold text-paper"
        >
          {actionError}
        </p>
      )}
      {(mine.error || schools.error) && (
        <p
          role="alert"
          className="mb-4 border-l-4 border-bando bg-bando/20 p-3 font-bold text-paper"
        >
          {mine.error ?? schools.error}
        </p>
      )}

      {!mine.loading && myVisible.length === 0 ? (
        <div className="flex justify-center py-10">
          <SpeechBubble who="narradora" tail="center">
            Nenhuma turma por aqui ainda. Clique em <strong>Nova turma</strong> para montar a
            primeira equipe!
          </SpeechBubble>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {myVisible.map((c, i) => (
            <ClassCard
              key={c.id}
              index={i}
              cls={c}
              schoolName={schoolName(c.schoolId)}
              onEdit={() => {
                setEditing(c);
                setDialogOpen(true);
              }}
              onToggleArchive={() => void toggleArchive(c)}
            />
          ))}
        </div>
      )}

      {isAdmin && others.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-1 font-heist text-3xl tracking-wider text-brass text-glow-brass">
            Turmas das outras Narradoras
          </h2>
          <p className="mb-4 font-type text-mist">Somente leitura (visão da administradora).</p>
          <div className="grid grid-cols-3 gap-6">
            {others.map((c, i) => (
              <ClassCard
                key={c.id}
                index={i}
                cls={c}
                schoolName={schoolName(c.schoolId)}
                ownerLabel={ownerLabel(c.instructorId)}
              />
            ))}
          </div>
        </section>
      )}

      <ClassFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        uid={profile.uid}
        schools={schools.data}
        editing={editing}
      />
    </InstructorLayout>
  );
}

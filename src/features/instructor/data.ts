import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import type { AllowedInstructorDoc, ClassDoc, InstructorDoc, SchoolDoc } from '@/types/domain';

export type WithId<T> = T & { id: string };
type Live<T> = { data: WithId<T>[]; loading: boolean; error: string | null };

/**
 * Escuta uma consulta do Firestore em tempo real.
 * `key` resume a consulta: quando muda, a escuta é refeita. `build` retorna null para não escutar.
 */
function useLiveQuery<T>(build: () => Query<DocumentData> | null, key: string): Live<T> {
  const [snap, setSnap] = useState<{ key: string; data: WithId<T>[]; error: string | null } | null>(
    null,
  );
  const enabled = build() !== null;
  useEffect(() => {
    const q = build();
    if (!q) return;
    return onSnapshot(
      q,
      (res) =>
        setSnap({
          key,
          data: res.docs.map((d) => ({ id: d.id, ...(d.data() as T) })),
          error: null,
        }),
      (err) => {
        console.error('[firestore]', err);
        setSnap({ key, data: [], error: 'Não consegui carregar os dados.' });
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!enabled) return { data: [], loading: false, error: null };
  if (!snap || snap.key !== key) return { data: [], loading: true, error: null };
  return { data: snap.data, loading: false, error: snap.error };
}

const db = () => getFirebase().db;

export function useSchools() {
  return useLiveQuery<SchoolDoc>(() => collection(db(), 'schools'), 'schools');
}

/** Turmas da instrutora (RN-01). Filtra só por dono: sem índice composto. */
export function useMyClasses(uid: string) {
  return useLiveQuery<ClassDoc>(
    () => query(collection(db(), 'classes'), where('instructorId', '==', uid)),
    `my-classes-${uid}`,
  );
}

/** Admin: todas as turmas (somente leitura para as de outras pessoas). */
export function useAllClasses(enabled: boolean) {
  return useLiveQuery<ClassDoc>(
    () => (enabled ? collection(db(), 'classes') : null),
    `all-classes-${enabled}`,
  );
}

export function useInstructors(enabled: boolean) {
  return useLiveQuery<InstructorDoc>(
    () => (enabled ? collection(db(), 'instructors') : null),
    `instructors-${enabled}`,
  );
}

export function useAllowlist(enabled: boolean) {
  return useLiveQuery<AllowedInstructorDoc>(
    () => (enabled ? collection(db(), 'allowedInstructors') : null),
    `allowlist-${enabled}`,
  );
}

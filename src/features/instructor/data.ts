import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Query,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import type {
  AllowedInstructorDoc,
  ClassDoc,
  InstructorDoc,
  MatchDoc,
  PlayerDoc,
  SchoolDoc,
  SessionDoc,
  TeamDoc,
} from '@/types/domain';

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

type LiveDoc<T> = { data: WithId<T> | null; loading: boolean; error: string | null };

/** Escuta um documento em tempo real. */
export function useLiveDoc<T>(path: string | null): LiveDoc<T> {
  const [snap, setSnap] = useState<{
    path: string;
    data: WithId<T> | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!path) return;
    return onSnapshot(
      doc(getFirebase().db, path),
      (d) =>
        setSnap({ path, data: d.exists() ? { id: d.id, ...(d.data() as T) } : null, error: null }),
      (err) => {
        console.error('[firestore]', err);
        setSnap({ path, data: null, error: 'Não consegui carregar.' });
      },
    );
  }, [path]);
  if (!path) return { data: null, loading: false, error: null };
  if (!snap || snap.path !== path) return { data: null, loading: true, error: null };
  return { data: snap.data, loading: false, error: snap.error };
}

export function useClass(classId: string | null) {
  return useLiveDoc<ClassDoc>(classId ? `classes/${classId}` : null);
}

export function useClassTeams(classId: string | null) {
  return useLiveQuery<TeamDoc>(
    () => (classId ? collection(db(), 'classes', classId, 'teams') : null),
    `teams-${classId}`,
  );
}

/** Sessão aberta da turma (RN-04: no máximo uma). */
export function useOpenSessions(uid: string, classId: string) {
  return useLiveQuery<SessionDoc>(
    () =>
      query(
        collection(db(), 'sessions'),
        where('instructorId', '==', uid),
        where('classId', '==', classId),
        where('status', '==', 'open'),
      ),
    `open-sessions-${uid}-${classId}`,
  );
}

export function useSession(sessionId: string | null) {
  return useLiveDoc<SessionDoc>(sessionId ? `sessions/${sessionId}` : null);
}

export function useSessionPlayers(sessionId: string | null) {
  return useLiveQuery<PlayerDoc>(
    () => (sessionId ? collection(db(), 'sessions', sessionId, 'players') : null),
    `players-${sessionId}`,
  );
}

export function useSessionMatches(sessionId: string | null) {
  return useLiveQuery<MatchDoc>(
    () => (sessionId ? collection(db(), 'sessions', sessionId, 'matches') : null),
    `matches-${sessionId}`,
  );
}

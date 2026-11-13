import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import type { LedgerEntryDoc, PlayerDoc, TeamDoc } from '@/types/domain';

type WithId<T> = T & { id: string };

/** Duplas da turma, em tempo real (ranking). Só liga quando `enabled` (RN-25: planning e end). */
export function useStudentClassTeams(classId: string, enabled: boolean): WithId<TeamDoc>[] {
  const [teams, setTeams] = useState<WithId<TeamDoc>[]>([]);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(getFirebase('student').db, 'classes', classId, 'teams'),
      (snap) => setTeams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDoc) }))),
      () => setTeams([]),
    );
  }, [classId, enabled]);
  return enabled ? teams : [];
}

/** Extrato da própria dupla nesta sessão (fim do episódio, RN-53). */
export function useSessionLedger(
  classId: string,
  teamId: string,
  sessionId: string,
  enabled: boolean,
): WithId<LedgerEntryDoc>[] {
  const [entries, setEntries] = useState<WithId<LedgerEntryDoc>[]>([]);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      query(
        collection(getFirebase('student').db, 'classes', classId, 'teams', teamId, 'ledger'),
        where('sessionId', '==', sessionId),
      ),
      (snap) =>
        setEntries(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as LedgerEntryDoc) }))
            .sort((a, b) => (a.at?.toMillis() ?? 0) - (b.at?.toMillis() ?? 0)),
        ),
      () => setEntries([]),
    );
  }, [classId, teamId, sessionId, enabled]);
  return enabled ? entries : [];
}

/** Pontos de hoje de todas as duplas: as regras só liberam na fase de fim (destaque da aula). */
export function useEndPlayers(sessionId: string, enabled: boolean): PlayerDoc[] {
  const [players, setPlayers] = useState<PlayerDoc[]>([]);
  useEffect(() => {
    if (!enabled) return;
    return onSnapshot(
      collection(getFirebase('student').db, 'sessions', sessionId, 'players'),
      (snap) => setPlayers(snap.docs.map((d) => d.data() as PlayerDoc)),
      () => setPlayers([]),
    );
  }, [sessionId, enabled]);
  return enabled ? players : [];
}

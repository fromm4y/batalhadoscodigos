import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getFirebase, isFirebaseConfigured } from '@/lib/firebase';

export type TeamClaims = { uid: string; teamId: string; classId: string; sessionId: string };
export type TeamAuthState =
  { status: 'loading' } | { status: 'none' } | { status: 'team'; claims: TeamClaims };

/** Dupla logada com custom token (claims role=team), se houver. */
export function useTeamAuth(): TeamAuthState {
  const [state, setState] = useState<TeamAuthState>(() =>
    isFirebaseConfigured ? { status: 'loading' } : { status: 'none' },
  );
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebase().auth, async (user) => {
      if (!user) return setState({ status: 'none' });
      const { claims } = await user.getIdTokenResult();
      if (claims.role !== 'team') return setState({ status: 'none' });
      setState({
        status: 'team',
        claims: {
          uid: user.uid,
          teamId: String(claims.teamId),
          classId: String(claims.classId),
          sessionId: String(claims.sessionId),
        },
      });
    });
  }, []);
  return state;
}

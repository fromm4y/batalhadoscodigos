import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { getFirebase, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { normalizeEmail } from '@/lib/email';
import type { AllowedInstructorDoc, Role } from '@/types/domain';

export type InstructorProfile = { uid: string; email: string; displayName: string; role: Role };

type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'denied'; email: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: InstructorProfile };

type AuthStore = {
  state: AuthState;
  init: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

let started = false;

async function upsertProfile(db: ReturnType<typeof getFirebase>['db'], profile: InstructorProfile) {
  try {
    const ref = doc(db, 'instructors', profile.uid);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
    } else {
      const cur = existing.data() as InstructorProfile;
      if (cur.role !== profile.role || cur.displayName !== profile.displayName) {
        await updateDoc(ref, { role: profile.role, displayName: profile.displayName });
      }
    }
  } catch (err) {
    console.warn('[auth] perfil', err);
  }
}

/**
 * Login das instrutoras (SPEC 5.3): Google → confere a allowlist → cria/atualiza `instructors/{uid}`.
 * Fora da allowlist: mostra "Peça acesso à administradora" e faz logout.
 */
export const useAuthStore = create<AuthStore>((set) => {
  async function checkAccess(user: User): Promise<void> {
    const { auth, db } = getFirebase();
    const email = normalizeEmail(user.email ?? '');
    try {
      // Tenta algumas vezes: uma falha rápida de internet não pode deslogar a Narradora.
      let allowed;
      for (let attempt = 1; ; attempt++) {
        try {
          allowed = await getDoc(doc(db, 'allowedInstructors', email));
          break;
        } catch (err) {
          console.warn('[auth] tentativa', attempt, err);
          if (attempt >= 4) throw err;
          await new Promise((r) => setTimeout(r, attempt * 1500));
        }
      }
      const data = allowed.data() as AllowedInstructorDoc | undefined;
      if (!data || !data.active) {
        await fbSignOut(auth);
        set({ state: { status: 'denied', email } });
        return;
      }
      const profile: InstructorProfile = {
        uid: user.uid,
        email,
        displayName: user.displayName ?? email,
        role: data.role,
      };
      // O perfil (instructors/{uid}) é atualizado em segundo plano: não segura a entrada.
      void upsertProfile(db, profile);
      set({ state: { status: 'ready', profile } });
    } catch (err) {
      console.error('[auth]', err);
      set({
        state: { status: 'error', message: 'Não consegui verificar seu acesso. Tente de novo.' },
      });
    }
  }

  return {
    state: { status: 'loading' },

    init() {
      if (started) return;
      started = true;
      if (!isFirebaseConfigured) {
        set({ state: { status: 'error', message: 'Firebase não configurado neste ambiente.' } });
        return;
      }
      const { auth } = getFirebase();
      onAuthStateChanged(auth, (user) => {
        // Duplas entram com custom token: não são instrutoras.
        const isGoogle = user?.providerData.some((p) => p.providerId === 'google.com');
        if (!user || !isGoogle) {
          set((s) => (s.state.status === 'denied' ? s : { state: { status: 'signedOut' } }));
          return;
        }
        set({ state: { status: 'loading' } });
        void checkAccess(user);
      });
    },

    async signIn() {
      const { auth } = getFirebase();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const code = (err as { code?: string }).code ?? '';
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
        console.error('[auth]', err);
        set({
          state: {
            status: 'error',
            message:
              code === 'auth/unauthorized-domain'
                ? 'Este endereço não está autorizado no Firebase (Domínios autorizados).'
                : code === 'auth/popup-blocked'
                  ? 'O navegador bloqueou a janela do Google. Libere pop-ups para este site.'
                  : 'Não deu para entrar com o Google. Tente de novo.',
          },
        });
      }
    },

    async signOut() {
      await fbSignOut(getFirebase().auth);
      set({ state: { status: 'signedOut' } });
    },
  };
});

/** Atalho: perfil da instrutora logada (ou null). */
export function useProfile(): InstructorProfile | null {
  return useAuthStore((s) => (s.state.status === 'ready' ? s.state.profile : null));
}

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithCredential,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

/** Modo de teste local com os emuladores do Firebase (`npm run dev:emu`). Nunca em produção. */
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const config = useEmulators
  ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-cacada', appId: 'demo-app' }
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

/** true quando as variáveis VITE_FIREBASE_* foram preenchidas. */
export const isFirebaseConfigured = Object.values(config).every(
  (v) => typeof v === 'string' && v.length > 0,
);

type FirebaseBundle = { app: FirebaseApp; auth: Auth; db: Firestore };

/**
 * Dois logins separados no mesmo navegador (para um não derrubar o outro):
 * - `instructor`: login Google da Narradora, guardado no navegador (só sai clicando em "Sair").
 * - `student`: login da dupla, guardado POR ABA (cada aba é uma dupla; recarregar mantém a dupla).
 */
export type FirebaseRole = 'instructor' | 'student';
const bundles: Partial<Record<FirebaseRole, FirebaseBundle>> = {};

/** Inicializa o Firebase sob demanda (o app abre mesmo sem config, p.ex. na página de teste). */
export function getFirebase(role: FirebaseRole = 'instructor'): FirebaseBundle {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase não configurado: preencha as variáveis VITE_FIREBASE_* (.env.local).',
    );
  }
  const cached = bundles[role];
  if (cached) return cached;
  const app = role === 'instructor' ? initializeApp(config) : initializeApp(config, 'aluno');
  const auth = initializeAuth(app, {
    persistence:
      role === 'instructor'
        ? [indexedDBLocalPersistence, browserLocalPersistence]
        : [browserSessionPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  const db = getFirestore(app);
  if (useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    if (role === 'instructor') {
      // Atalho de teste (só emulador): entra como uma conta Google falsa, sem popup.
      window.__emuGoogleLogin = async (email: string) => {
        const token = JSON.stringify({
          sub: email,
          email,
          email_verified: true,
          name: email.split('@')[0],
        });
        await signInWithCredential(auth, GoogleAuthProvider.credential(token));
      };
    }
  }
  const bundle = { app, auth, db };
  bundles[role] = bundle;
  return bundle;
}

export const googleProvider = new GoogleAuthProvider();

declare global {
  interface Window {
    /** Existe só no modo emulador (testes locais). */
    __emuGoogleLogin?: (email: string) => Promise<void>;
  }
}

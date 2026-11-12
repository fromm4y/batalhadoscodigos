import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
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
let bundle: FirebaseBundle | null = null;

/** Inicializa o Firebase sob demanda (o app abre mesmo sem config, p.ex. na página de teste). */
export function getFirebase(): FirebaseBundle {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase não configurado: preencha as variáveis VITE_FIREBASE_* (.env.local).',
    );
  }
  if (!bundle) {
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    if (useEmulators) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
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
    bundle = { app, auth, db };
  }
  return bundle;
}

export const googleProvider = new GoogleAuthProvider();

declare global {
  interface Window {
    /** Existe só no modo emulador (testes locais). */
    __emuGoogleLogin?: (email: string) => Promise<void>;
  }
}

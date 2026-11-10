import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const config = {
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
    bundle = { app, auth: getAuth(app), db: getFirestore(app) };
  }
  return bundle;
}

export const googleProvider = new GoogleAuthProvider();

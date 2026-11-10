/**
 * Inicialização compartilhada do firebase-admin para as Vercel Functions.
 * Pastas/arquivos com "_" não viram rota na Vercel.
 */
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

type AdminBundle = { app: App; auth: Auth; db: Firestore; projectId: string };
let cached: AdminBundle | null = null;

type RawServiceAccount = { project_id?: string; client_email?: string; private_key?: string };

function readServiceAccount(): ServiceAccount & { projectId: string } {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não definida.');
  const raw = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as RawServiceAccount;
  if (!raw.project_id || !raw.client_email || !raw.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON inválida (faltam campos).');
  }
  return { projectId: raw.project_id, clientEmail: raw.client_email, privateKey: raw.private_key };
}

export function getAdmin(): AdminBundle {
  if (cached) return cached;
  const sa = readServiceAccount();
  const app = getApps()[0] ?? initializeApp({ credential: cert(sa), projectId: sa.projectId });
  cached = { app, auth: getAuth(app), db: getFirestore(app), projectId: sa.projectId };
  return cached;
}

/**
 * Inicialização compartilhada do firebase-admin para as Vercel Functions.
 * Pastas/arquivos com "_" não viram rota na Vercel.
 */
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Aceita o JSON da conta de serviço colado direto (como baixado do Firebase)
 * ou codificado em base64.
 */
export function parseServiceAccount(value: string): unknown {
  const trimmed = value.trim();
  const json = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(json);
}

type AdminBundle = { app: App; auth: Auth; db: Firestore; projectId: string };
let cached: AdminBundle | null = null;

type RawServiceAccount = { project_id?: string; client_email?: string; private_key?: string };

function readServiceAccount(): ServiceAccount & { projectId: string } {
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!value) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não definida.');
  const raw = parseServiceAccount(value) as RawServiceAccount;
  if (!raw.project_id || !raw.client_email || !raw.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON inválida (faltam campos).');
  }
  return { projectId: raw.project_id, clientEmail: raw.client_email, privateKey: raw.private_key };
}

export function getAdmin(): AdminBundle {
  if (cached) return cached;
  // Testes locais: com os emuladores ligados, não usa credencial (nunca acontece na Vercel).
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const projectId = process.env.GCLOUD_PROJECT ?? 'demo-cacada';
    const app = getApps()[0] ?? initializeApp({ projectId });
    cached = { app, auth: getAuth(app), db: getFirestore(app), projectId };
    return cached;
  }
  const sa = readServiceAccount();
  const app = getApps()[0] ?? initializeApp({ credential: cert(sa), projectId: sa.projectId });
  cached = { app, auth: getAuth(app), db: getFirestore(app), projectId: sa.projectId };
  return cached;
}

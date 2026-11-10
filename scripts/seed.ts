/**
 * Seed inicial (SPEC 6.3): escolas + admin na allowlist.
 * Uso: preencher FIREBASE_SERVICE_ACCOUNT_JSON e ADMIN_EMAIL no .env.local e rodar `npm run seed`.
 * Pode rodar quantas vezes quiser (idempotente).
 */
import { readFileSync, existsSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { SCHOOLS } from '../src/content/names.ts';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] && process.env[m[1]] === undefined) process.env[m[1]] = m[2] ?? '';
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const saValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
if (!saValue || !adminEmail) {
  console.error('Defina FIREBASE_SERVICE_ACCOUNT_JSON e ADMIN_EMAIL no .env.local.');
  process.exit(1);
}

const saText = saValue.trim().startsWith('{')
  ? saValue.trim()
  : Buffer.from(saValue.trim(), 'base64').toString('utf8');
const sa = JSON.parse(saText) as {
  project_id: string;
  client_email: string;
  private_key: string;
};
initializeApp({
  credential: cert({
    projectId: sa.project_id,
    clientEmail: sa.client_email,
    privateKey: sa.private_key,
  }),
});
const db = getFirestore();

const batch = db.batch();
for (const s of SCHOOLS) {
  batch.set(db.doc(`schools/${s.id}`), { name: s.name, active: true }, { merge: true });
}
batch.set(
  db.doc(`allowedInstructors/${adminEmail}`),
  {
    email: adminEmail,
    role: 'admin',
    addedBy: 'seed',
    addedAt: FieldValue.serverTimestamp(),
    active: true,
  },
  { merge: true },
);
await batch.commit();
console.log(
  `✅ Seed ok no projeto ${sa.project_id}: ${SCHOOLS.length} escolas + admin ${adminEmail}.`,
);

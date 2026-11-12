/**
 * Seed inicial (SPEC 6.3): escolas + admin na allowlist. Mesmo efeito de abrir /api/setup.
 * Uso: preencher FIREBASE_SERVICE_ACCOUNT_JSON e ADMIN_EMAIL no .env.local e rodar `npm run seed`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseServiceAccount } from '../api/_lib/admin.ts';
import { runSeed } from '../api/_lib/seed.ts';

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
const adminEmail = process.env.ADMIN_EMAIL;
if (!saValue || !adminEmail) {
  console.error('Defina FIREBASE_SERVICE_ACCOUNT_JSON e ADMIN_EMAIL no .env.local.');
  process.exit(1);
}

const sa = parseServiceAccount(saValue) as {
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
const result = await runSeed(getFirestore(), adminEmail);
console.log(
  `✅ Seed ok no projeto ${sa.project_id}: ${result.schools} escolas + admin ${result.adminEmail}.`,
);

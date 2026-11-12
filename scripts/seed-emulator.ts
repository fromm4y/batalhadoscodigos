/**
 * Dados de teste para os emuladores (`npm run dev:emu`). Nunca roda contra o Firebase real:
 * só funciona com FIRESTORE_EMULATOR_HOST definido (o `firebase emulators:exec` define).
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { runSeed } from '../api/_lib/seed.ts';

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('seed-emulator só roda com os emuladores ligados.');
  process.exit(1);
}
initializeApp({ projectId: 'demo-cacada' });
const db = getFirestore();
await runSeed(db, 'admin@teste.br');
await db.doc('allowedInstructors/ana@teste.br').set({
  email: 'ana@teste.br',
  role: 'instructor',
  active: true,
  addedBy: 'seed',
  addedAt: new Date(),
});
console.log('✅ Emulador pronto: admin@teste.br (admin) e ana@teste.br (narradora).');

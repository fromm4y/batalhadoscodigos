/**
 * Confere, nos emuladores, se a soma do ledger de cada dupla bate com o total (RN-24) e se ninguém
 * ficou negativo (RN-22). Uso: com `npm run dev:emu` rodando, `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx tsx scripts/check-ledger-emulator.ts`.
 */
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Só roda com os emuladores ligados (FIRESTORE_EMULATOR_HOST).');
  process.exit(1);
}
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'demo-cacada' });
const db = getFirestore();
const classes = await db.collection('classes').get();
let all = true;
for (const c of classes.docs) {
  const teams = await c.ref.collection('teams').get();
  for (const t of teams.docs) {
    const led = await t.ref.collection('ledger').get();
    const sum = led.docs.reduce((s, d) => s + (d.data().delta as number), 0);
    const total = t.data().totalPoints as number;
    const reasons = led.docs.map((d) => `${d.data().reason}:${d.data().delta}`).join(' ');
    const okRow = sum === total && total >= 0;
    all &&= okRow;
    console.log(
      okRow ? '✅' : '❌',
      `${c.data().name} / ${t.data().cityName}: total ${total}, soma do ledger ${sum} (${led.size} lançamentos)`,
    );
    if (c.data().name === 'Turma A' && t.data().cityName === 'Recife') console.log('   ', reasons);
  }
}
console.log(all ? 'TUDO BATE' : 'DIVERGÊNCIA');
if (!all) process.exit(1);

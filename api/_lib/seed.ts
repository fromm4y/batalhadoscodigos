import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { SCHOOLS } from './schools.js';

export type SeedResult = { schools: number; adminEmail: string; adminCreated: boolean };

/**
 * Cria/atualiza as escolas e coloca a admin (ADMIN_EMAIL) na allowlist.
 * Idempotente: rodar de novo não duplica nada nem muda a data de criação.
 */
export async function runSeed(db: Firestore, rawAdminEmail: string): Promise<SeedResult> {
  const adminEmail = rawAdminEmail.trim().toLowerCase();
  const adminRef = db.doc(`allowedInstructors/${adminEmail}`);
  const existing = await adminRef.get();

  const batch = db.batch();
  for (const s of SCHOOLS) {
    batch.set(db.doc(`schools/${s.id}`), { name: s.name, active: true }, { merge: true });
  }
  batch.set(
    adminRef,
    {
      email: adminEmail,
      role: 'admin',
      active: true,
      ...(existing.exists ? {} : { addedBy: 'seed', addedAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );
  await batch.commit();
  return { schools: SCHOOLS.length, adminEmail, adminCreated: !existing.exists };
}

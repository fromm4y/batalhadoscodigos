/**
 * SPEC-02 A3/A4 (LGPD): limpeza de sessões antigas e encerramento de temporada da turma.
 * Tudo com firebase-admin (`recursiveDelete` leva junto as subcoleções). Cada ação fica
 * registrada em `auditLog` sem nenhum dado de aluno.
 */
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import type { InstructorIdentity } from './instructor.js';
import { HttpError } from './instructor.js';
import { saveEpisodeReport } from './report.js';

const DAY = 86_400_000;

async function audit(
  db: Firestore,
  me: InstructorIdentity,
  action: string,
  extra: Record<string, unknown>,
) {
  await db
    .collection('auditLog')
    .add({ by: me.uid, action, at: FieldValue.serverTimestamp(), ...extra });
}

/**
 * Apaga sessões que venceram há mais de `olderThanDays` dias, com `players`, `matches`,
 * `helpRequests`, `feed`, `firsts` e `attempts`. A Narradora limpa só as próprias; a admin, todas.
 * O ranking não muda: os pontos ficam no `ledger` das duplas.
 */
export async function cleanupOldSessions(
  db: Firestore,
  me: InstructorIdentity,
  olderThanDays: number,
  nowMs = Date.now(),
): Promise<number> {
  const cutoff = Timestamp.fromMillis(nowMs - olderThanDays * DAY);
  const base = db.collection('sessions');
  // Sem índice composto: a Narradora filtra pelas próprias e a data é conferida aqui.
  const snap =
    me.role === 'admin'
      ? await base.where('expiresAt', '<', cutoff).get()
      : await base.where('instructorId', '==', me.uid).get();
  const old = snap.docs.filter((d) => {
    const exp = d.data().expiresAt as Timestamp | undefined;
    return !!exp && exp.toMillis() < cutoff.toMillis();
  });
  // SPEC-02 F2: antes de apagar, guarda o resumo de cada episódio (sobrevive à limpeza)
  const pairs = new Set(old.map((d) => `${d.data().classId}|${d.data().episodeId}`));
  for (const pair of pairs) {
    const [classId, episodeId] = pair.split('|');
    if (classId && episodeId) await saveEpisodeReport(db, classId, episodeId);
  }
  for (const d of old) await db.recursiveDelete(d.ref);
  await audit(db, me, 'cleanup-sessions', { olderThanDays, deleted: old.length });
  return old.length;
}

/** Turma da Narradora (ou qualquer uma, para a admin). */
export async function ownedClass(db: Firestore, me: InstructorIdentity, classId: string) {
  const ref = db.doc(`classes/${classId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Turma não encontrada.');
  if (snap.data()?.instructorId !== me.uid && me.role !== 'admin')
    throw new HttpError(403, 'Só a Narradora dona da turma (ou a admin) pode fazer isso.');
  return { ref, data: snap.data() as { name: string } };
}

export const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR');

/**
 * Encerrar temporada (A4): apaga duplas (com ledger e PINs) e sessões da turma e arquiva a turma.
 * Exige o nome da turma digitado igual. O CSV e os certificados são gerados ANTES, no navegador.
 */
export async function closeSeason(
  db: Firestore,
  me: InstructorIdentity,
  classId: string,
  confirmName: string,
): Promise<{ teams: number; sessions: number }> {
  const cls = await ownedClass(db, me, classId);
  if (!sameName(confirmName, cls.data.name))
    throw new HttpError(400, 'O nome digitado não confere com o nome da turma.');
  const teams = await cls.ref.collection('teams').get();
  for (const t of teams.docs) await db.recursiveDelete(t.ref);
  const sessions = await db.collection('sessions').where('classId', '==', classId).get();
  for (const s of sessions.docs) await db.recursiveDelete(s.ref);
  await cls.ref.update({ archived: true, seasonClosedAt: FieldValue.serverTimestamp() });
  await audit(db, me, 'season-close', { classId, teams: teams.size, sessions: sessions.size });
  return { teams: teams.size, sessions: sessions.size };
}

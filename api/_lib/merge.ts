/**
 * Mesclar (pedido da May, 25/11):
 * - duas FICHAS da mesma dupla (a dupla criou uma ficha nova numa sessão separada);
 * - duas TURMAS (as duplas e sessões de uma vão para a outra);
 * - e, na importação entre bancos, a mesma regra de ficha (`mergeTeamDocs`).
 *
 * Os pontos vêm do extrato (`ledger`): os lançamentos têm id único, então juntar os extratos
 * nunca conta duas vezes, e o total é recalculado pela soma (RN-24). Cartas: a dourada vale mais.
 * Selos e carimbos: juntos, sem repetir. Nome, personagem e PIN: os da ficha que fica.
 */
import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase-admin/firestore';
import type { InstructorIdentity } from './instructor.js';
import { HttpError } from './instructor.js';

type Card = { episodeId: string; variant: 'normal' | 'dourada'; earnedAt?: unknown };
type Badge = { id: string; episodeId: string; at?: unknown };
type Stamp = { episodeId: string; side: string; result: string };

/** Selos que valem uma vez na temporada (igual a `src/engine/badges.ts`). */
const ONCE = new Set(['duasCaras', 'colecionador']);
const RESULT_RANK: Record<string, number> = { venceu: 3, empate: 2, perdeu: 1, jogou: 0 };

export function mergeCards(a: Card[] = [], b: Card[] = []): Card[] {
  const by = new Map<string, Card>();
  for (const c of [...a, ...b]) {
    const have = by.get(c.episodeId);
    if (!have || (have.variant === 'normal' && c.variant === 'dourada')) by.set(c.episodeId, c);
  }
  return [...by.values()];
}

export function mergeBadges(a: Badge[] = [], b: Badge[] = []): Badge[] {
  const out: Badge[] = [];
  for (const x of [...a, ...b]) {
    const dup = out.some((y) => y.id === x.id && (ONCE.has(x.id) || y.episodeId === x.episodeId));
    if (!dup) out.push(x);
  }
  return out;
}

/** Um carimbo por episódio; se as duas fichas jogaram o mesmo episódio, vale o melhor resultado. */
export function mergeStamps(a: Stamp[] = [], b: Stamp[] = []): Stamp[] {
  const by = new Map<string, Stamp>();
  for (const s of [...a, ...b]) {
    const have = by.get(s.episodeId);
    if (!have || (RESULT_RANK[s.result] ?? 0) > (RESULT_RANK[have.result] ?? 0))
      by.set(s.episodeId, s);
  }
  return [...by.values()];
}

/** Ficha mesclada: identidade da que fica + inventário das duas + total pela soma do extrato. */
export function mergeTeamDocs(
  keep: DocumentData,
  other: DocumentData,
  ledgerTotal: number,
): DocumentData {
  const stamps = mergeStamps(keep.stamps as Stamp[], other.stamps as Stamp[]);
  return {
    ...keep,
    totalPoints: Math.max(0, ledgerTotal),
    cards: mergeCards(keep.cards as Card[], other.cards as Card[]),
    badges: mergeBadges(keep.badges as Badge[], other.badges as Badge[]),
    stamps,
    episodesPlayed: Math.max(stamps.length, Number(keep.episodesPlayed ?? 0)),
  };
}

async function ownedClass(db: Firestore, me: InstructorIdentity, classId: string) {
  const snap = await db.doc(`classes/${classId}`).get();
  if (!snap.exists) throw new HttpError(404, 'Turma não encontrada.');
  if (snap.data()?.instructorId !== me.uid && me.role !== 'admin')
    throw new HttpError(403, 'Só a Narradora dona da turma (ou a admin) pode mesclar.');
  return snap;
}

async function audit(db: Firestore, me: InstructorIdentity, extra: Record<string, unknown>) {
  await db.collection('auditLog').add({ by: me.uid, at: FieldValue.serverTimestamp(), ...extra });
}

/**
 * Junta a ficha `fromId` na ficha `keepId` (mesma turma). Leva o extrato, as cartas, os selos e
 * os carimbos; nas sessões da turma, o progresso/habilidades da dupla passam para a ficha que fica
 * (sem apagar o que ela já tinha na mesma sessão). No fim, apaga a ficha repetida (e o PIN dela).
 */
export async function mergeTeams(
  db: Firestore,
  me: InstructorIdentity,
  classId: string,
  keepId: string,
  fromId: string,
): Promise<{ totalPoints: number; ledger: number; sessions: number }> {
  if (keepId === fromId) throw new HttpError(400, 'Escolha duas fichas diferentes.');
  await ownedClass(db, me, classId);
  const keepRef = db.doc(`classes/${classId}/teams/${keepId}`);
  const fromRef = db.doc(`classes/${classId}/teams/${fromId}`);
  const [keepSnap, fromSnap] = await Promise.all([keepRef.get(), fromRef.get()]);
  if (!keepSnap.exists || !fromSnap.exists) throw new HttpError(404, 'Ficha não encontrada.');

  const w = db.bulkWriter();
  // 1) extrato: os lançamentos da ficha repetida vão para a que fica (mesmo id = sem duplicar)
  const [keepLedger, fromLedger] = await Promise.all([
    keepRef.collection('ledger').get(),
    fromRef.collection('ledger').get(),
  ]);
  const ids = new Set(keepLedger.docs.map((d) => d.id));
  let total = keepLedger.docs.reduce((s, d) => s + Number(d.data().delta ?? 0), 0);
  for (const d of fromLedger.docs) {
    if (ids.has(d.id)) continue;
    void w.set(keepRef.collection('ledger').doc(d.id), d.data());
    total += Number(d.data().delta ?? 0);
  }
  // 2) ficha mesclada
  const merged = mergeTeamDocs(keepSnap.data()!, fromSnap.data()!, total);
  void w.set(keepRef, merged);

  // 3) sessões da turma: a dupla repetida vira a que fica
  const sessions = await db.collection('sessions').where('classId', '==', classId).get();
  let touched = 0;
  for (const s of sessions.docs) {
    const pFrom = await s.ref.collection('players').doc(fromId).get();
    if (pFrom.exists) {
      const pKeep = await s.ref.collection('players').doc(keepId).get();
      if (!pKeep.exists)
        void w.set(s.ref.collection('players').doc(keepId), { ...pFrom.data(), teamId: keepId });
      void w.delete(pFrom.ref);
      touched++;
    }
    for (const m of (await s.ref.collection('matches').get()).docs) {
      const d = m.data();
      const patch: Record<string, unknown> = {};
      if (d.redTeamId === fromId) patch.redTeamId = keepId;
      if (d.blueTeamId === fromId) patch.blueTeamId = keepId;
      if (d.coop) {
        const swap = (l: string[] = []) => [...new Set(l.map((x) => (x === fromId ? keepId : x)))];
        const reinf = Object.fromEntries(
          Object.entries((d.coop.reinforcements ?? {}) as Record<string, string>).map(([a, b]) => [
            a === fromId ? keepId : a,
            b === fromId ? keepId : b,
          ]),
        );
        patch.coop = {
          teams: swap(d.coop.teams),
          vaultSolvers: swap(d.coop.vaultSolvers),
          reinforcements: reinf,
        };
      }
      if (Object.keys(patch).length) void w.update(m.ref, patch);
    }
  }
  await w.close();
  // 4) apaga a ficha repetida (com o extrato antigo e o PIN dela)
  await db.recursiveDelete(fromRef);
  await audit(db, me, { action: 'merge_teams', classId, ledger: fromLedger.size });
  return { totalPoints: merged.totalPoints as number, ledger: fromLedger.size, sessions: touched };
}

/**
 * Junta a turma `fromClassId` na `keepClassId`: as duplas (com extrato e PIN) e as sessões passam
 * para a turma que fica; a outra é apagada. Depois dá para mesclar as fichas repetidas.
 */
export async function mergeClasses(
  db: Firestore,
  me: InstructorIdentity,
  keepClassId: string,
  fromClassId: string,
): Promise<{ teams: number; sessions: number }> {
  if (keepClassId === fromClassId) throw new HttpError(400, 'Escolha duas turmas diferentes.');
  await ownedClass(db, me, keepClassId);
  await ownedClass(db, me, fromClassId);
  const open = await db
    .collection('sessions')
    .where('classId', '==', fromClassId)
    .where('status', '==', 'open')
    .get();
  if (!open.empty) throw new HttpError(409, 'Encerre a sessão aberta da outra turma antes.');

  const w = db.bulkWriter();
  const teams = await db.collection(`classes/${fromClassId}/teams`).get();
  async function copyTree(src: DocumentReference, dstPath: string) {
    const snap = await src.get();
    if (snap.exists) void w.set(db.doc(dstPath), snap.data()!);
    for (const sub of await src.listCollections())
      for (const d of (await sub.get()).docs) await copyTree(d.ref, `${dstPath}/${sub.id}/${d.id}`);
  }
  for (const t of teams.docs) await copyTree(t.ref, `classes/${keepClassId}/teams/${t.id}`);
  const sessions = await db.collection('sessions').where('classId', '==', fromClassId).get();
  for (const s of sessions.docs) void w.update(s.ref, { classId: keepClassId });
  await w.close();
  await db.recursiveDelete(db.doc(`classes/${fromClassId}`));
  await audit(db, me, { action: 'merge_classes', keepClassId, fromClassId, teams: teams.size });
  return { teams: teams.size, sessions: sessions.size };
}

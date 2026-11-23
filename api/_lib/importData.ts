/**
 * Banco reserva (pedido da May, 23/11): copia os dados de OUTRO projeto do Firebase (a origem)
 * para este (o destino), para a turma continuar no reserva com tudo o que tinha: turmas, duplas,
 * PINs, pontos (ledger), cartas, selos, histórico das sessões e Narradoras autorizadas.
 *
 * O mesmo login Google ganha um uid diferente em cada projeto, então o dono de cada turma e
 * sessão é TRADUZIDO pelo e-mail (`mapUid`). Quem ainda não entrou no destino fica de fora da
 * tradução e aparece no resultado (basta entrar uma vez e importar de novo).
 *
 * Sobrescreve documento por documento (o destino fica igual à origem); não apaga nada que só
 * exista no destino. Volta ao original = o mesmo botão no site original, com a origem trocada.
 */
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore';

/** Coleções de topo copiadas (o auditLog de cada projeto fica no próprio projeto). */
const TOP = ['allowedInstructors', 'schools', 'config', 'instructors', 'classes', 'sessions'];
/** Subcoleções que não precisam ir (linha do tempo e chamados de ajuda das sessões). */
const SKIP_SUB = new Set(['feed', 'helpRequests']);
/** Campos com o uid da Narradora dona (traduzidos pelo e-mail). */
const OWNER_FIELDS = ['instructorId'];

export type ImportResult = {
  docs: number;
  /** e-mails de Narradoras que ainda não entraram no destino (turmas delas ficam sem dono) */
  unmapped: string[];
};

/** Monta a tradução uid da origem → uid do destino, pelo e-mail das Narradoras. */
export async function buildUidMap(
  src: Firestore,
  findDestUid: (email: string) => Promise<string | null>,
): Promise<{ map: Map<string, string>; unmapped: string[] }> {
  const map = new Map<string, string>();
  const unmapped: string[] = [];
  for (const d of (await src.collection('instructors').get()).docs) {
    const email = String(d.data().email ?? '').toLowerCase();
    const dest = email ? await findDestUid(email) : null;
    if (dest) map.set(d.id, dest);
    else if (email) unmapped.push(email);
  }
  return { map, unmapped };
}

/** Troca os uids de dono pelo uid do destino (os que não têm tradução ficam como estão). */
export function remapOwners(data: DocumentData, map: Map<string, string>): DocumentData {
  const out = { ...data };
  for (const f of OWNER_FIELDS) {
    const v = out[f];
    if (typeof v === 'string' && map.has(v)) out[f] = map.get(v);
  }
  return out;
}

export async function importAll(
  src: Firestore,
  dst: Firestore,
  findDestUid: (email: string) => Promise<string | null>,
): Promise<ImportResult> {
  const { map, unmapped } = await buildUidMap(src, findDestUid);
  const writer = dst.bulkWriter();
  let docs = 0;

  async function copyCollection(col: CollectionReference, destPath: string) {
    const snap = await col.get();
    for (const d of snap.docs) {
      let id = d.id;
      let data = remapOwners(d.data(), map);
      // perfil da Narradora: o id do documento é o próprio uid
      if (col.path === 'instructors') {
        const dest = map.get(d.id);
        if (!dest) continue;
        id = dest;
        data = { ...data, uid: dest };
      }
      const target: DocumentReference = dst.doc(`${destPath}/${id}`);
      void writer.set(target, data);
      docs++;
      for (const sub of await d.ref.listCollections()) {
        if (SKIP_SUB.has(sub.id)) continue;
        await copyCollection(sub, `${target.path}/${sub.id}`);
      }
    }
  }

  for (const name of TOP) await copyCollection(src.collection(name), name);
  await writer.close();
  return { docs, unmapped };
}

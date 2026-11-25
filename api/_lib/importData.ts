/**
 * Banco reserva (pedido da May, 23/11): copia os dados de OUTRO projeto do Firebase (a origem)
 * para este (o destino), para a turma continuar no reserva com tudo o que tinha: turmas, duplas,
 * PINs, pontos (ledger), cartas, selos, histórico das sessões e Narradoras autorizadas.
 *
 * O mesmo login Google ganha um uid diferente em cada projeto, então o dono de cada turma e
 * sessão é TRADUZIDO pelo e-mail (`mapUid`). Quem ainda não entrou no destino fica de fora da
 * tradução e aparece no resultado (basta entrar uma vez e importar de novo).
 *
 * MESCLA (25/11): o que já existe no destino fica como está e só entra o que falta; a ficha de
 * dupla que existe nos dois junta o extrato (mesmo id = mesmo lançamento, nunca conta duas vezes)
 * e o inventário (cartas, selos, carimbos), e o total é recalculado pela soma. Nada é apagado.
 * Volta ao original = o mesmo botão no site original, com a origem trocada.
 */
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore';
import { mergeTeamDocs } from './merge.js';

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

  /** Ficha de dupla: extrato unido (mesmo id = mesmo lançamento) e inventário das duas. */
  async function mergeTeam(
    srcRef: DocumentReference,
    srcData: DocumentData,
    target: DocumentReference,
  ) {
    const [dstSnap, srcLedger, dstLedger, dstAuth] = await Promise.all([
      target.get(),
      srcRef.collection('ledger').get(),
      target.collection('ledger').get(),
      target.collection('private').doc('auth').get(),
    ]);
    const have = new Set(dstLedger.docs.map((d) => d.id));
    let total = dstLedger.docs.reduce((n, d) => n + Number(d.data().delta ?? 0), 0);
    for (const d of srcLedger.docs) {
      if (have.has(d.id)) continue;
      void writer.set(target.collection('ledger').doc(d.id), d.data());
      total += Number(d.data().delta ?? 0);
      docs++;
    }
    // PIN: o do destino continua valendo; só copia se a ficha ainda não tinha
    const srcAuth = await srcRef.collection('private').doc('auth').get();
    if (!dstAuth.exists && srcAuth.exists) {
      void writer.set(target.collection('private').doc('auth'), srcAuth.data()!);
      docs++;
    }
    const base = dstSnap.exists ? dstSnap.data()! : srcData;
    void writer.set(target, mergeTeamDocs(base, srcData, total));
    docs++;
  }

  async function copyCollection(col: CollectionReference, destPath: string) {
    const snap = await col.get();
    const isTeams = /^classes\/[^/]+\/teams$/.test(col.path);
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
      if (isTeams) {
        await mergeTeam(d.ref, data, target);
        continue;
      }
      // MESCLAR (25/11): o que já existe no destino fica como está; só entra o que falta
      const existing = await target.get();
      if (!existing.exists) {
        void writer.set(target, data);
        docs++;
      } else {
        // dona que só entrou depois da 1ª importação: agora a turma/sessão ganha a dona certa
        const owner = existing.data()?.instructorId;
        if (typeof owner === 'string' && map.has(owner))
          void writer.update(target, { instructorId: map.get(owner) });
      }
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

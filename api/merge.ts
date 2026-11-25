/**
 * POST /api/merge + ID token da Narradora (pedido da May, 25/11).
 * - { kind: "teams", classId, keepId, fromId }: junta a ficha repetida da dupla na original.
 * - { kind: "classes", keepClassId, fromClassId, confirmName }: junta a outra turma nesta.
 * Só a dona da turma (ou a admin). Tudo fica no `auditLog`. Lógica em `_lib/merge.ts`.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';
import { mergeClasses, mergeTeams } from './_lib/merge.js';

const ID = /^[A-Za-z0-9]{1,40}$/;
const id = (v: unknown) => (typeof v === 'string' && ID.test(v) ? v : null);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  try {
    const { db, auth } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    if (b.kind === 'teams') {
      const classId = id(b.classId);
      const keepId = id(b.keepId);
      const fromId = id(b.fromId);
      if (!classId || !keepId || !fromId) return sendError(res, 400, 'Escolha as duas fichas.');
      const r = await mergeTeams(db, me, classId, keepId, fromId);
      return void res.status(200).json({ ok: true, ...r });
    }
    if (b.kind === 'classes') {
      const keep = id(b.keepClassId);
      const from = id(b.fromClassId);
      if (!keep || !from) return sendError(res, 400, 'Escolha as duas turmas.');
      const fromSnap = await db.doc(`classes/${from}`).get();
      const name = String(fromSnap.data()?.name ?? '');
      if (typeof b.confirmName !== 'string' || b.confirmName.trim() !== name)
        return sendError(
          res,
          400,
          `Digite o nome da turma que vai sumir ("${name}") para confirmar.`,
        );
      const r = await mergeClasses(db, me, keep, from);
      return void res.status(200).json({ ok: true, ...r });
    }
    sendError(res, 400, 'Pedido de mescla desconhecido.');
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    if ((err as { code?: unknown }).code === 8)
      return sendError(res, 503, 'O limite grátis do dia do Firebase acabou. Tente depois das 5h.');
    console.error('[merge]', err);
    sendError(res, 500, 'Não consegui mesclar. Tente de novo.');
  }
}

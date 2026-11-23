/**
 * POST /api/admin-import { confirm: "COPIAR" } + ID token da admin (banco reserva, 23/11).
 * Copia turmas, duplas, PINs, pontos, cartas, selos, sessões e Narradoras do projeto de ORIGEM
 * (`FIREBASE_SOURCE_SERVICE_ACCOUNT_JSON`) para ESTE projeto. Só a admin. Fica no `auditLog`.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdmin, getSourceDb } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { importAll } from './_lib/importData.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  if (body(req).confirm !== 'COPIAR')
    return sendError(res, 400, 'Digite COPIAR para confirmar a importação.');
  try {
    const { db, auth, projectId } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    if (me.role !== 'admin') return sendError(res, 403, 'Só a administradora importa dados.');
    const source = getSourceDb();
    if (!source)
      return sendError(
        res,
        409,
        'Falta a variável FIREBASE_SOURCE_SERVICE_ACCOUNT_JSON (a chave do banco de origem) na Vercel deste site.',
      );
    if (source.projectId === projectId)
      return sendError(res, 409, 'A origem é o próprio banco deste site. Confira a variável.');
    const r = await importAll(source.db, db, async (email) => {
      try {
        return (await auth.getUserByEmail(email)).uid;
      } catch {
        return null;
      }
    });
    await db.collection('auditLog').add({
      by: me.uid,
      action: 'import',
      from: source.projectId,
      docs: r.docs,
      at: FieldValue.serverTimestamp(),
    });
    res.status(200).json({ ok: true, from: source.projectId, ...r });
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    // cota grátis do dia esgotada (no banco de origem ou neste): avisar com clareza
    if ((err as { code?: unknown }).code === 8)
      return sendError(
        res,
        503,
        'O limite grátis do dia do Firebase acabou (num dos bancos). Ele zera por volta das 5h da manhã: tente depois desse horário.',
      );
    console.error('[admin-import]', err);
    sendError(res, 500, 'Não consegui importar. Confira a chave de origem e tente de novo.');
  }
}

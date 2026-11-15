/**
 * POST /api/season-close { classId, confirmName } + ID token (SPEC-02 A4).
 * Apaga duplas, ledger, PINs e sessões da turma e arquiva a turma. Dona da turma ou admin.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { closeSeason } from './_lib/dataLifecycle.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';

const ID = /^[A-Za-z0-9]{1,40}$/;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  const classId = typeof b.classId === 'string' && ID.test(b.classId) ? b.classId : null;
  const confirmName = typeof b.confirmName === 'string' ? b.confirmName : '';
  if (!classId || !confirmName) return sendError(res, 400, 'Informe a turma e digite o nome dela.');
  try {
    const { db, auth } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    const r = await closeSeason(db, me, classId, confirmName);
    res.status(200).json({ ok: true, ...r });
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    console.error('[season-close]', err);
    sendError(res, 500, 'Não consegui encerrar a temporada. Tente de novo.');
  }
}

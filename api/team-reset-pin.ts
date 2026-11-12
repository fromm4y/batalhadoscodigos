/**
 * POST /api/team-reset-pin { classId, teamId } + ID token da Narradora → { ok } (SPEC 8.1).
 * Só a dona da turma ou a admin. Limpa o PIN; a dupla cria um novo no próximo login.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';

const ID = /^[A-Za-z0-9]{1,40}$/;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  const classId = typeof b.classId === 'string' && ID.test(b.classId) ? b.classId : null;
  const teamId = typeof b.teamId === 'string' && ID.test(b.teamId) ? b.teamId : null;
  if (!classId || !teamId) return sendError(res, 400, 'Turma ou dupla inválida.');

  try {
    const { db, auth } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    const cls = await db.doc(`classes/${classId}`).get();
    if (!cls.exists) return sendError(res, 404, 'Turma não encontrada.');
    if (cls.data()?.instructorId !== me.uid && me.role !== 'admin') {
      return sendError(res, 403, 'Só a Narradora dona da turma pode resetar o PIN.');
    }
    const authRef = db.doc(`classes/${classId}/teams/${teamId}/private/auth`);
    if (!(await authRef.get()).exists) return sendError(res, 404, 'Dupla não encontrada.');
    await authRef.update({ pinHash: null, failedAttempts: 0, lockedUntil: null });
    res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    console.error('[team-reset-pin]', err);
    sendError(res, 500, 'Não consegui resetar o PIN. Tente de novo.');
  }
}

/**
 * POST /api/session-open { classId, episodeId } + ID token da Narradora → { sessionId, code } (RN-03, RN-04).
 * Fica no servidor porque o código precisa ser único entre TODAS as sessões abertas,
 * e a Narradora só enxerga as próprias sessões.
 * Se a turma já tem sessão aberta e no prazo, devolve a mesma (uma sessão aberta por turma).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { SEASON } from '../src/content/season.js';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';
import { findOpenSessionByCode, sessionExpiry } from './_lib/sessions.js';
import { generateCode } from './_lib/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  const classId =
    typeof b.classId === 'string' && /^[A-Za-z0-9]{1,40}$/.test(b.classId) ? b.classId : null;
  const episode = SEASON.find((e) => e.id === b.episodeId && e.available);
  if (!classId || !episode) return sendError(res, 400, 'Escolha a turma e um episódio disponível.');

  try {
    const { db, auth } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    const cls = await db.doc(`classes/${classId}`).get();
    if (!cls.exists) return sendError(res, 404, 'Turma não encontrada.');
    if (cls.data()?.instructorId !== me.uid) {
      return sendError(res, 403, 'Só a Narradora dona da turma abre sessões para ela.');
    }
    if (cls.data()?.archived)
      return sendError(res, 409, 'Reative a turma antes de abrir uma sessão.');

    // RN-04: uma sessão aberta por turma. Sessões vencidas são encerradas aqui.
    const open = await db
      .collection('sessions')
      .where('classId', '==', classId)
      .where('status', '==', 'open')
      .get();
    const now = Date.now();
    for (const d of open.docs) {
      const exp = d.data().expiresAt as Timestamp | undefined;
      if (exp && exp.toMillis() > now) {
        return void res.status(200).json({
          ok: true,
          sessionId: d.id,
          code: d.data().code as string,
          existing: true,
        });
      }
      await d.ref.update({ status: 'finished' });
    }

    let code = '';
    for (let i = 0; i < 20; i++) {
      const candidate = generateCode();
      if (!(await findOpenSessionByCode(db, candidate))) {
        code = candidate;
        break;
      }
    }
    if (!code) return sendError(res, 503, 'Não achei um código livre. Tente de novo.');

    const ref = db.collection('sessions').doc();
    await ref.create({
      classId,
      instructorId: me.uid,
      episodeId: episode.id,
      code,
      status: 'open',
      phase: 'lobby',
      phaseStartedAt: FieldValue.serverTimestamp(),
      matchesFormed: false,
      freeze: { active: false, message: '' },
      transmission: { active: false, id: '', startedAt: null },
      museumEvent: { status: 'idle', startedAt: null, triggeredBy: null },
      autoEventAt: null,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: sessionExpiry(now),
    });
    res.status(200).json({ ok: true, sessionId: ref.id, code, existing: false });
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    console.error('[session-open]', err);
    sendError(res, 500, 'Não consegui abrir a sessão. Tente de novo.');
  }
}

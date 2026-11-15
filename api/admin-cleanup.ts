/**
 * POST /api/admin-cleanup { scope: "sessions", olderThanDays? } + ID token (SPEC-02 A3).
 * Apaga sessões vencidas há mais de N dias [PADRÃO 30]. Narradora: só as próprias. Admin: todas.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GAME_RULES } from '../src/config/gameRules.js';
import { getAdmin } from './_lib/admin.js';
import { cleanupOldSessions } from './_lib/dataLifecycle.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { HttpError, requireInstructor } from './_lib/instructor.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  if (b.scope !== 'sessions') return sendError(res, 400, 'Escopo de limpeza inválido.');
  const days =
    b.olderThanDays === undefined ? GAME_RULES.cleanup.olderThanDays : Number(b.olderThanDays);
  if (!Number.isInteger(days) || days < 1 || days > 3650)
    return sendError(res, 400, 'Número de dias inválido.');
  try {
    const { db, auth } = getAdmin();
    const me = await requireInstructor(req, auth, db);
    const deleted = await cleanupOldSessions(db, me, days);
    res.status(200).json({ ok: true, deleted });
  } catch (err) {
    if (err instanceof HttpError) return sendError(res, err.status, err.message);
    console.error('[admin-cleanup]', err);
    sendError(res, 500, 'Não consegui limpar as sessões. Tente de novo.');
  }
}

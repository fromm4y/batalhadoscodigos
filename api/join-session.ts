/**
 * POST /api/join-session { code } → dados públicos da sessão e das duplas da turma (SPEC 8.1).
 * Só códigos INVÁLIDOS contam para o limite por IP (decisão da May: a escola inteira sai pelo mesmo IP).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, clientIpHash, sendError } from './_lib/http.js';
import { classLevel, findOpenSessionByCode, listPublicTeams } from './_lib/sessions.js';
import {
  isRateBlocked,
  normalizeCode,
  registerInvalidCode,
  type RateState,
} from './_lib/validate.js';
import { GAME_RULES } from '../src/config/gameRules.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  try {
    const { db } = getAdmin();
    const now = Date.now();
    const rateRef = db.doc(`rateLimits/${clientIpHash(req)}`);
    const rate = ((await rateRef.get()).data() as RateState | undefined) ?? null;
    if (isRateBlocked(rate, now)) {
      return sendError(
        res,
        429,
        'Muitas tentativas erradas. Esperem 1 minutinho e tentem de novo.',
        {
          code: 'rate_limited',
        },
      );
    }

    const code = normalizeCode(body(req).code);
    const session = code ? await findOpenSessionByCode(db, code) : null;
    if (!session) {
      await rateRef.set(registerInvalidCode(rate, now));
      return sendError(res, 404, 'A Narradora ainda não deu o sinal... Confiram o código!', {
        code: 'not_found',
      });
    }

    const [teams, level] = await Promise.all([
      listPublicTeams(db, session.classId),
      classLevel(db, session.classId),
    ]);
    res.status(200).json({
      ok: true,
      sessionId: session.id,
      classId: session.classId,
      level,
      episodeId: session.episodeId,
      code: session.code,
      teams,
      takenNames: {
        cities: teams.map((t) => t.cityName),
        pirates: teams.map((t) => t.pirateName),
      },
      classFull: teams.length >= GAME_RULES.maxTeamsPerClass,
    });
  } catch (err) {
    console.error('[join-session]', err);
    sendError(res, 500, 'O museu está com problemas técnicos. Chamem a Narradora!', {
      code: 'server',
    });
  }
}

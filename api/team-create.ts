/**
 * POST /api/team-create { code, cityName, pirateName, avatar, pin } → { customToken, teamId } (SPEC 8.1).
 * Nomes das listas e livres na turma (RN-49), PIN de 4 dígitos, turma com menos de 10 duplas (RN-02).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue } from 'firebase-admin/firestore';
import { GAME_RULES } from '../src/config/gameRules.js';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { hashPin } from './_lib/pin.js';
import { findOpenSessionByCode, initialPlayer, teamUid } from './_lib/sessions.js';
import {
  isCityName,
  isPirateName,
  isValidPin,
  normalizeCode,
  parseAvatar,
} from './_lib/validate.js';

class Conflict extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  const code = normalizeCode(b.code);
  const avatar = parseAvatar(b.avatar);
  if (
    !code ||
    !avatar ||
    !isCityName(b.cityName) ||
    !isPirateName(b.pirateName) ||
    !isValidPin(b.pin)
  ) {
    return sendError(res, 400, 'Dados incompletos. Voltem e confiram cada passo.', {
      code: 'invalid',
    });
  }
  const { cityName, pirateName, pin } = b;

  try {
    const { db, auth } = getAdmin();
    const session = await findOpenSessionByCode(db, code);
    if (!session) {
      return sendError(res, 404, 'A Narradora ainda não deu o sinal...', { code: 'not_found' });
    }
    const pinHash = await hashPin(pin);
    const teamsCol = db.collection(`classes/${session.classId}/teams`);
    const teamRef = teamsCol.doc();
    const uid = teamUid(teamRef.id, session.id);

    await db.runTransaction(async (tx) => {
      const existing = await tx.get(teamsCol);
      if (existing.size >= GAME_RULES.maxTeamsPerClass) {
        throw new Conflict('A turma já tem o máximo de duplas. Chamem a Narradora!', 'class_full');
      }
      for (const t of existing.docs) {
        if (t.data().cityName === cityName) {
          throw new Conflict(
            `O codinome ${cityName} acabou de ser escolhido. Peguem outro!`,
            'city_taken',
          );
        }
        if (t.data().pirateName === pirateName) {
          throw new Conflict(
            `O nome ${pirateName} acabou de ser escolhido. Peguem outro!`,
            'pirate_taken',
          );
        }
      }
      tx.create(teamRef, {
        cityName,
        pirateName,
        avatar,
        totalPoints: 0,
        episodesPlayed: 0,
        badges: [],
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.create(teamRef.collection('private').doc('auth'), {
        pinHash,
        failedAttempts: 0,
        lockedUntil: null,
      });
      tx.create(
        db.doc(`sessions/${session.id}/players/${teamRef.id}`),
        initialPlayer(teamRef.id, uid),
      );
    });

    const customToken = await auth.createCustomToken(uid, {
      role: 'team',
      teamId: teamRef.id,
      classId: session.classId,
      sessionId: session.id,
    });
    res.status(200).json({ ok: true, customToken, teamId: teamRef.id });
  } catch (err) {
    if (err instanceof Conflict) return sendError(res, 409, err.message, { code: err.code });
    console.error('[team-create]', err);
    sendError(res, 500, 'Não deu para criar a dupla agora. Tentem de novo.', { code: 'server' });
  }
}

/**
 * POST /api/team-login { code, teamId, pin } → { customToken } (SPEC 8.1).
 * 5 erros seguidos bloqueiam a dupla por 60 s (RN-52). Se a Narradora resetou o PIN,
 * o PIN enviado vira o novo PIN da dupla.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, body, sendError } from './_lib/http.js';
import { hashPin, verifyPin } from './_lib/pin.js';
import { findOpenSessionByCode, initialPlayer, teamUid } from './_lib/sessions.js';
import {
  applyPinFailure,
  isValidPin,
  lockedSecondsLeft,
  normalizeCode,
  type PinState,
} from './_lib/validate.js';

type Outcome =
  | { kind: 'ok'; newPin: boolean }
  | { kind: 'locked'; secondsLeft: number }
  | { kind: 'wrong'; attemptsLeft: number; secondsLeft: number };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['POST'])) return;
  const b = body(req);
  const code = normalizeCode(b.code);
  const teamId =
    typeof b.teamId === 'string' && /^[A-Za-z0-9]{1,40}$/.test(b.teamId) ? b.teamId : null;
  if (!code || !teamId || !isValidPin(b.pin)) {
    return sendError(res, 400, 'Digitem o PIN de 4 números.', { code: 'invalid' });
  }
  const pin = b.pin;

  try {
    const { db, auth } = getAdmin();
    const session = await findOpenSessionByCode(db, code);
    if (!session)
      return sendError(res, 404, 'A Narradora ainda não deu o sinal...', { code: 'not_found' });

    const teamRef = db.doc(`classes/${session.classId}/teams/${teamId}`);
    const authRef = teamRef.collection('private').doc('auth');
    const newHash = await hashPin(pin); // usado só se o PIN tiver sido resetado

    const outcome = await db.runTransaction<Outcome>(async (tx) => {
      const [team, authDoc] = await Promise.all([tx.get(teamRef), tx.get(authRef)]);
      if (!team.exists || !authDoc.exists) throw new Error('team_not_found');
      const a = authDoc.data() as {
        pinHash: string | null;
        failedAttempts: number;
        lockedUntil: Timestamp | null;
      };
      const now = Date.now();
      const state: PinState = {
        failedAttempts: a.failedAttempts ?? 0,
        lockedUntilMs: a.lockedUntil ? a.lockedUntil.toMillis() : null,
      };
      const left = lockedSecondsLeft(state, now);
      if (left > 0) return { kind: 'locked', secondsLeft: left };

      if (!a.pinHash) {
        tx.update(authRef, { pinHash: newHash, failedAttempts: 0, lockedUntil: null });
        return { kind: 'ok', newPin: true };
      }
      if (await verifyPin(pin, a.pinHash)) {
        tx.update(authRef, { failedAttempts: 0, lockedUntil: null });
        return { kind: 'ok', newPin: false };
      }
      const next = applyPinFailure(state, now);
      tx.update(authRef, {
        failedAttempts: next.failedAttempts,
        lockedUntil: next.lockedUntilMs ? Timestamp.fromMillis(next.lockedUntilMs) : null,
      });
      return {
        kind: 'wrong',
        attemptsLeft: next.attemptsLeft,
        secondsLeft: lockedSecondsLeft(next, now),
      };
    });

    if (outcome.kind === 'locked') {
      return sendError(
        res,
        423,
        `Dupla bloqueada por segurança. Esperem ${outcome.secondsLeft} s.`,
        {
          code: 'locked',
          secondsLeft: outcome.secondsLeft,
        },
      );
    }
    if (outcome.kind === 'wrong') {
      return outcome.secondsLeft > 0
        ? sendError(res, 423, `PIN errado 5 vezes. Dupla bloqueada por ${outcome.secondsLeft} s.`, {
            code: 'locked',
            secondsLeft: outcome.secondsLeft,
          })
        : sendError(res, 401, `PIN errado! Restam ${outcome.attemptsLeft} tentativas.`, {
            code: 'wrong_pin',
            attemptsLeft: outcome.attemptsLeft,
          });
    }

    // Reconexão (SPEC 5.2): mantém o progresso, só troca o uid do token.
    const uid = teamUid(teamId, session.id);
    const playerRef = db.doc(`sessions/${session.id}/players/${teamId}`);
    await db.runTransaction(async (tx) => {
      const p = await tx.get(playerRef);
      if (p.exists) tx.update(playerRef, { uid, lastSeenAt: FieldValue.serverTimestamp() });
      else tx.create(playerRef, initialPlayer(teamId, uid));
    });

    const customToken = await auth.createCustomToken(uid, {
      role: 'team',
      teamId,
      classId: session.classId,
      sessionId: session.id,
    });
    res.status(200).json({ ok: true, customToken, teamId, newPin: outcome.newPin });
  } catch (err) {
    if (err instanceof Error && err.message === 'team_not_found') {
      return sendError(res, 404, 'Essa dupla não existe nesta turma.', { code: 'team_not_found' });
    }
    console.error('[team-login]', err);
    sendError(res, 500, 'Não deu para entrar agora. Tentem de novo.', { code: 'server' });
  }
}

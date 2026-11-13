import type { VercelRequest } from '@vercel/node';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { bearerToken } from './http.js';

export type InstructorIdentity = { uid: string; email: string; role: 'admin' | 'instructor' };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Confere o ID token Google da Narradora e a allowlist (SPEC 5.3).
 * Lança HttpError 401/403 quando não autorizada.
 */
export async function requireInstructor(
  req: VercelRequest,
  auth: Auth,
  db: Firestore,
): Promise<InstructorIdentity> {
  const token = bearerToken(req);
  if (!token) throw new HttpError(401, 'Faça login como Narradora.');
  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    throw new HttpError(401, 'Sessão de login expirada. Entre de novo.');
  }
  if (
    decoded.firebase.sign_in_provider !== 'google.com' ||
    !decoded.email ||
    !decoded.email_verified
  ) {
    throw new HttpError(403, 'Só Narradoras (login Google) podem fazer isso.');
  }
  const email = decoded.email.trim().toLowerCase();
  const allowed = await db.doc(`allowedInstructors/${email}`).get();
  const data = allowed.data() as { active?: boolean; role?: 'admin' | 'instructor' } | undefined;
  if (!data?.active || !data.role) throw new HttpError(403, 'Acesso de Narradora não autorizado.');
  return { uid: decoded.uid, email, role: data.role };
}

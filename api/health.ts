/** GET /api/health — confirma que a função sobe e que o firebase-admin conecta. */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { allowMethods } from './_lib/http.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const { db } = getAdmin();
    const schools = await db.collection('schools').count().get();
    res.status(200).json({ ok: true, firebaseAdmin: true, schools: schools.data().count });
  } catch (err) {
    console.error('[health]', err);
    res
      .status(200)
      .json({ ok: true, firebaseAdmin: false, error: 'firebase-admin não configurado.' });
  }
}

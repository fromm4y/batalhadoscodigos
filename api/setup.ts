/**
 * GET /api/setup — configuração inicial com um clique (escolas + admin).
 * Seguro de expor: só grava dados fixos do código e o e-mail da variável ADMIN_EMAIL,
 * e é idempotente (abrir de novo não muda nada).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdmin } from './_lib/admin.js';
import { allowMethods, sendError } from './_lib/http.js';
import { runSeed } from './_lib/seed.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!allowMethods(req, res, ['GET'])) return;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return sendError(res, 500, 'ADMIN_EMAIL não definida na Vercel.');
  try {
    const result = await runSeed(getAdmin().db, adminEmail);
    res.status(200).json({
      ok: true,
      mensagem: 'Tudo pronto! Escolas e admin configuradas.',
      escolas: result.schools,
      admin: result.adminCreated ? 'criada agora' : 'já existia',
    });
  } catch (err) {
    console.error('[setup]', err);
    sendError(res, 500, 'Não consegui configurar. Veja os logs da Vercel.');
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Resposta de erro padronizada, com mensagem em pt-BR para a UI. */
export function sendError(res: VercelResponse, status: number, message: string): void {
  res.status(status).json({ ok: false, error: message });
}

/** Garante o método HTTP; devolve false (e já responde 405) se não bater. */
export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (req.method && methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, 'Método não permitido.');
  return false;
}

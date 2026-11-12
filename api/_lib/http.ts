import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Resposta de erro padronizada, com mensagem em pt-BR para a UI e um código estável. */
export function sendError(
  res: VercelResponse,
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
): void {
  res.status(status).json({ ok: false, error: message, ...extra });
}

/** Garante o método HTTP; devolve false (e já responde 405) se não bater. */
export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]): boolean {
  if (req.method && methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, 'Método não permitido.');
  return false;
}

/** Corpo JSON como objeto (a Vercel já faz o parse quando o Content-Type é JSON). */
export function body(req: VercelRequest): Record<string, unknown> {
  const b: unknown = req.body;
  if (typeof b === 'string') {
    try {
      const parsed: unknown = JSON.parse(b);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return b && typeof b === 'object' ? (b as Record<string, unknown>) : {};
}

/** IP do cliente, guardado só como hash (não é dado pessoal armazenado em claro). */
export function clientIpHash(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || 'desconhecido';
  return createHash('sha256').update(`cacada:${raw}`).digest('hex').slice(0, 32);
}

/** Token "Bearer" do cabeçalho Authorization. */
export function bearerToken(req: VercelRequest): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice('Bearer '.length).trim() || null;
}

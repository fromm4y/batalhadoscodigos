import { getFirebase } from './firebase';

/** Respostas das funções da Vercel (api/*). */
export type ApiError = {
  ok: false;
  error: string;
  code?: string;
  attemptsLeft?: number;
  secondsLeft?: number;
};
export type ApiResult<T> = ({ ok: true } & T) | ApiError;

export async function postJson<T>(
  path: string,
  body: unknown,
  token?: string,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (data && typeof data === 'object' && 'ok' in data) return data;
    return { ok: false, error: 'Resposta estranha do servidor. Tentem de novo.', code: 'server' };
  } catch {
    return { ok: false, error: 'Sem conexão com o museu. Confiram a internet.', code: 'network' };
  }
}

/** Chamada autenticada como Narradora (ID token Google). */
export async function postAsInstructor<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  const user = getFirebase().auth.currentUser;
  if (!user) return { ok: false, error: 'Faça login de novo.', code: 'auth' };
  return postJson<T>(path, body, await user.getIdToken());
}

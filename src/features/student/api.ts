import type { AvatarConfig, Level } from '@/types/domain';

/** Respostas das funções da Vercel (api/*). */
export type ApiError = {
  ok: false;
  error: string;
  code?: string;
  attemptsLeft?: number;
  secondsLeft?: number;
};
export type ApiResult<T> = ({ ok: true } & T) | ApiError;

export type PublicTeam = {
  teamId: string;
  cityName: string;
  pirateName: string;
  avatar: AvatarConfig;
  needsNewPin: boolean;
};

export type JoinData = {
  sessionId: string;
  classId: string;
  level: Level;
  episodeId: string;
  code: string;
  teams: PublicTeam[];
  takenNames: { cities: string[]; pirates: string[] };
  classFull: boolean;
};

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

export const joinSession = (code: string) => postJson<JoinData>('/api/join-session', { code });

export const createTeam = (input: {
  code: string;
  cityName: string;
  pirateName: string;
  avatar: AvatarConfig;
  pin: string;
}) => postJson<{ customToken: string; teamId: string }>('/api/team-create', input);

export const loginTeam = (input: { code: string; teamId: string; pin: string }) =>
  postJson<{ customToken: string; teamId: string; newPin: boolean }>('/api/team-login', input);

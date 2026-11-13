import { postJson } from '@/lib/api';
import type { AvatarConfig, Level } from '@/types/domain';

export type { ApiError, ApiResult } from '@/lib/api';

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

import { GAME_RULES } from '@/config/gameRules';

/** Folga sobre o intervalo da presença antes de considerar a dupla desconectada. */
const GRACE = 2.5;

/** A dupla está conectada? (marcou presença há pouco e não saiu da página) */
export function isOnline(connected: boolean, lastSeenMs: number | null, nowMs: number): boolean {
  if (!connected || lastSeenMs === null) return false;
  return nowMs - lastSeenMs <= GAME_RULES.presence.heartbeatSeconds * 1000 * GRACE;
}

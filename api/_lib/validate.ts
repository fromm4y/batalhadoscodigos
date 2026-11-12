/**
 * Validações e regras puras do servidor (sem Firebase): testáveis com Vitest.
 */
import { GAME_RULES } from '../../src/config/gameRules.js';
import { CITY_NAMES, PIRATE_NAMES } from '../../src/content/names.js';
import type { AvatarConfig } from '../../src/types/domain.js';

const { codeAlphabet, codeLength } = GAME_RULES.session;

/** Código de sessão: 4 caracteres sem 0/O/1/I (RN-03). */
export function generateCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < codeLength; i++) {
    code += codeAlphabet[Math.floor(random() * codeAlphabet.length)];
  }
  return code;
}

/** Normaliza o código digitado (maiúsculas, sem espaços). Null se não for um código possível. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.replace(/\s+/g, '').toUpperCase();
  if (code.length !== codeLength) return null;
  for (const ch of code) if (!codeAlphabet.includes(ch)) return null;
  return code;
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && new RegExp(`^\\d{${GAME_RULES.team.pinLength}}$`).test(pin);
}

const AVATAR_RANGES: Record<keyof AvatarConfig, [number, number]> = {
  skin: [1, 6],
  hair: [1, 8],
  hairColor: [1, 5],
  eyes: [1, 4],
  mouth: [1, 4],
  accessory: [0, 3],
};

/** Aceita só um AvatarConfig completo e dentro das faixas (seção 9.5). */
export function parseAvatar(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(AVATAR_RANGES) as (keyof AvatarConfig)[];
  if (Object.keys(obj).length !== keys.length) return null;
  const out: Record<string, number> = {};
  for (const k of keys) {
    const v = obj[k];
    const [min, max] = AVATAR_RANGES[k];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) return null;
    out[k] = v;
  }
  return out as AvatarConfig;
}

export function isCityName(v: unknown): v is string {
  return typeof v === 'string' && (CITY_NAMES as readonly string[]).includes(v);
}

export function isPirateName(v: unknown): v is string {
  return typeof v === 'string' && (PIRATE_NAMES as readonly string[]).includes(v);
}

// ---------- Bloqueio do PIN (RN-52) ----------
export type PinState = { failedAttempts: number; lockedUntilMs: number | null };

export function lockedSecondsLeft(state: PinState, nowMs: number): number {
  if (!state.lockedUntilMs || state.lockedUntilMs <= nowMs) return 0;
  return Math.ceil((state.lockedUntilMs - nowMs) / 1000);
}

/** Aplica um erro de PIN: no 5º erro seguido, bloqueia por 60 s e zera o contador. */
export function applyPinFailure(
  state: PinState,
  nowMs: number,
): PinState & { attemptsLeft: number } {
  const failed = state.failedAttempts + 1;
  if (failed >= GAME_RULES.team.maxPinAttempts) {
    return {
      failedAttempts: 0,
      lockedUntilMs: nowMs + GAME_RULES.team.pinLockSeconds * 1000,
      attemptsLeft: 0,
    };
  }
  return {
    failedAttempts: failed,
    lockedUntilMs: null,
    attemptsLeft: GAME_RULES.team.maxPinAttempts - failed,
  };
}

// ---------- Limite de códigos inválidos por IP (decisão da May) ----------
export type RateState = { count: number; windowStartMs: number };

/** Registra um código inválido na janela atual. */
export function registerInvalidCode(state: RateState | null, nowMs: number): RateState {
  const windowMs = GAME_RULES.joinRateLimit.windowSeconds * 1000;
  if (!state || nowMs - state.windowStartMs >= windowMs) return { count: 1, windowStartMs: nowMs };
  return { count: state.count + 1, windowStartMs: state.windowStartMs };
}

/** O IP já gastou as tentativas inválidas desta janela? */
export function isRateBlocked(state: RateState | null, nowMs: number): boolean {
  if (!state) return false;
  const windowMs = GAME_RULES.joinRateLimit.windowSeconds * 1000;
  return (
    nowMs - state.windowStartMs < windowMs &&
    state.count >= GAME_RULES.joinRateLimit.maxInvalidCodesPerIp
  );
}

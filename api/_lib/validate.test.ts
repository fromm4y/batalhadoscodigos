import { describe, expect, it } from 'vitest';
import { GAME_RULES } from '../../src/config/gameRules.js';
import { hashPin, verifyPin } from './pin.js';
import {
  applyPinFailure,
  generateCode,
  isCityName,
  isPirateName,
  isRateBlocked,
  isValidPin,
  lockedSecondsLeft,
  normalizeCode,
  parseAvatar,
  registerInvalidCode,
} from './validate.js';

describe('código da sessão (RN-03)', () => {
  it('tem 4 caracteres e nunca usa 0, O, 1 ou I', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateCode();
      expect(code).toMatch(/^[A-Z2-9]{4}$/);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('normaliza o que a criança digitou', () => {
    expect(normalizeCode(' k7q2 ')).toBe('K7Q2');
    expect(normalizeCode('K7 Q2')).toBe('K7Q2');
    expect(normalizeCode('K7Q')).toBeNull();
    expect(normalizeCode('K0Q2')).toBeNull();
    expect(normalizeCode(42)).toBeNull();
  });
});

describe('PIN', () => {
  it('aceita só 4 dígitos', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    expect(isValidPin(1234)).toBe(false);
  });

  it('guarda só o hash e confere corretamente', async () => {
    const stored = await hashPin('4321');
    expect(stored).not.toContain('4321');
    expect(await verifyPin('4321', stored)).toBe(true);
    expect(await verifyPin('4320', stored)).toBe(false);
    expect(await hashPin('4321')).not.toBe(stored); // sal aleatório
  });

  it('5 erros seguidos bloqueiam por 60 s (RN-52)', () => {
    let state = { failedAttempts: 0, lockedUntilMs: null as number | null };
    const now = 1_000_000;
    for (let i = 1; i <= 4; i++) {
      const r = applyPinFailure(state, now);
      expect(r.lockedUntilMs).toBeNull();
      expect(r.attemptsLeft).toBe(5 - i);
      state = r;
    }
    const locked = applyPinFailure(state, now);
    expect(locked.lockedUntilMs).toBe(now + GAME_RULES.team.pinLockSeconds * 1000);
    expect(locked.failedAttempts).toBe(0);
    expect(lockedSecondsLeft(locked, now)).toBe(60);
    expect(lockedSecondsLeft(locked, now + 59_500)).toBe(1);
    expect(lockedSecondsLeft(locked, now + 60_000)).toBe(0);
  });
});

describe('cadastro da dupla', () => {
  const avatar = { skin: 3, hair: 8, hairColor: 5, eyes: 4, mouth: 1, accessory: 0 };

  it('aceita avatar completo dentro das faixas', () => {
    expect(parseAvatar(avatar)).toEqual(avatar);
  });

  it('rejeita avatar fora das faixas, incompleto ou com campos extras', () => {
    expect(parseAvatar({ ...avatar, skin: 7 })).toBeNull();
    expect(parseAvatar({ ...avatar, accessory: -1 })).toBeNull();
    expect(parseAvatar({ ...avatar, eyes: 1.5 })).toBeNull();
    const { mouth: _m, ...semBoca } = avatar;
    expect(parseAvatar(semBoca)).toBeNull();
    expect(parseAvatar({ ...avatar, foto: 'x' })).toBeNull();
    expect(parseAvatar(null)).toBeNull();
  });

  it('só aceita nomes das listas fechadas (RN-49)', () => {
    expect(isCityName('Recife')).toBe(true);
    expect(isCityName('Gotham')).toBe(false);
    expect(isPirateName('Âncora Dourada')).toBe(true);
    expect(isPirateName('Ancora Dourada')).toBe(false);
  });
});

describe('limite de códigos inválidos por IP', () => {
  it('bloqueia depois de 30 erros na mesma janela e libera na próxima', () => {
    const now = 5_000_000;
    let state = null as ReturnType<typeof registerInvalidCode> | null;
    for (let i = 0; i < GAME_RULES.joinRateLimit.maxInvalidCodesPerIp; i++) {
      expect(isRateBlocked(state, now)).toBe(false);
      state = registerInvalidCode(state, now);
    }
    expect(isRateBlocked(state, now)).toBe(true);
    expect(isRateBlocked(state, now + 60_000)).toBe(false);
    expect(registerInvalidCode(state, now + 60_000).count).toBe(1);
  });
});

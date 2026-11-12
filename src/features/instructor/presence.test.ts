import { describe, expect, it } from 'vitest';
import { isOnline } from './presence';

describe('presença da dupla', () => {
  const now = 1_000_000;
  it('conectada e vista há pouco = online', () => {
    expect(isOnline(true, now - 10_000, now)).toBe(true);
  });
  it('sem sinal há muito tempo = desconectada (aba fechada sem aviso)', () => {
    expect(isOnline(true, now - 120_000, now)).toBe(false);
  });
  it('saiu da página = desconectada', () => {
    expect(isOnline(false, now - 1000, now)).toBe(false);
    expect(isOnline(true, null, now)).toBe(false);
  });
});

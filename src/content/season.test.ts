import { describe, expect, it } from 'vitest';
import { seasonFromDate } from './season';
import { levelFromGrade } from '@/config/gameRules';

describe('seasonFromDate', () => {
  it('gera o trimestre a partir da data', () => {
    expect(seasonFromDate(new Date(2026, 10, 17))).toBe('2026-T4');
    expect(seasonFromDate(new Date(2027, 0, 5))).toBe('2027-T1');
  });
});

describe('levelFromGrade', () => {
  it('mapeia série para nível (RN-01)', () => {
    expect([4, 5, 6, 7, 8, 9].map(levelFromGrade)).toEqual(['A', 'A', 'B', 'B', 'C', 'C']);
  });
});

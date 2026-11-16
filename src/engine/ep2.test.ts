import { describe, expect, it } from 'vitest';
import type { CipherVariant, Episode } from '@/content/types';
import ep2Json from '@/content/episodes/ep2.json';
import type { Level } from '@/types/domain';
import { checkCipher, checkCipherVerify, resolveChallenge, resolveBonus } from './challenges';
import { needsTransmission, spokenClueFor } from './progress';

const ep2 = ep2Json as unknown as Episode;
const LEVELS: Level[] = ['A', 'B', 'C'];
const SLOTS = [0, 1, 2, 'vault'] as const;

describe('Ep. 2 é resolvível nos 3 níveis, dos dois lados', () => {
  for (const side of ['red', 'blue'] as const)
    for (const lv of LEVELS)
      it(`${side} ${lv}`, () => {
        const all = [...SLOTS.map((s) => resolveChallenge(ep2, side, lv, s))];
        const bonus = resolveBonus(ep2, side, lv);
        if (bonus) all.push(bonus);
        for (const ch of all) {
          if (ch.type !== 'cipher') continue;
          const v = ch.variant;
          if (v.mode === 'verify') {
            expect(checkCipherVerify(v, v.correct!)).toBe(true);
            expect(checkCipherVerify(v, (v.correct! + 1) % v.options!.length)).toBe(false);
          } else {
            // minúsculas, acentos e espaços extras não atrapalham (RN-28)
            expect(checkCipher(v, `  ${v.answer!.toLowerCase()} `)).toBe(true);
            expect(checkCipher(v, v.answer!.slice(1))).toBe(false);
            expect(checkCipher(v, '')).toBe(false);
          }
        }
      });
});

describe('Ep. 2: chave falada (RN-45)', () => {
  it('o cadeado 3 espera a transmissão; os outros não', () => {
    for (const side of ['red', 'blue'] as const)
      for (const lv of LEVELS) {
        expect(needsTransmission(resolveChallenge(ep2, side, lv, 2))).toBe(true);
        expect(needsTransmission(resolveChallenge(ep2, side, lv, 1))).toBe(false);
        expect(needsTransmission(resolveChallenge(ep2, side, lv, 'vault'))).toBe(false);
      }
  });
  it('a pista falada diz exatamente a chave do desafio', () => {
    for (const side of ['red', 'blue'] as const)
      for (const lv of LEVELS) {
        const ch = resolveChallenge(ep2, side, lv, 2);
        const v = ch.variant as CipherVariant;
        const say = spokenClueFor(ep2.narratorScript, lv, ch.key);
        expect(say).toMatch(new RegExp(`\\b${v.shift}\\b`));
        // a chave não aparece escrita no enunciado
        expect(v.prompt).not.toMatch(new RegExp(`\\b${v.shift}\\b`));
      }
  });
});

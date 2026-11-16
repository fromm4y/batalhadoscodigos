import { describe, expect, it } from 'vitest';
import type { CipherVariant, Episode } from '@/content/types';
import ep2Json from '@/content/episodes/ep2.json';
import type { Level } from '@/types/domain';
import {
  checkCipher,
  checkCipherVerify,
  hasStage2,
  resolveBonus,
  resolveChallenge,
} from './challenges';
import { needsTransmission, spokenClueFor } from './progress';

const ep2 = ep2Json as unknown as Episode;
const LEVELS: Level[] = ['A', 'B', 'C'];
const SLOTS = [0, 1, 2, 'vault'] as const;

describe('Ep. 2 é resolvível nos 3 níveis, dos dois lados', () => {
  for (const side of ['red', 'blue'] as const)
    for (const lv of LEVELS)
      it(`${side} ${lv}`, () => {
        // 17/11: as duas etapas de cada desafio
        const all = SLOTS.flatMap((s) => [
          resolveChallenge(ep2, side, lv, s, 0),
          resolveChallenge(ep2, side, lv, s, 1),
        ]);
        expect(SLOTS.every((s) => hasStage2(ep2, side, s))).toBe(true);
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
        // etapa 2 do cadeado 3: mesma chave falada (a dupla já ouviu), sem nova transmissão
        const s1 = resolveChallenge(ep2, side, lv, 2, 0).variant as CipherVariant;
        const s2 = resolveChallenge(ep2, side, lv, 2, 1).variant as CipherVariant;
        expect(s2.spokenKey && s2.shift === s1.shift).toBe(true);
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

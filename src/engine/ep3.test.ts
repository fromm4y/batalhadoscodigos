import { describe, expect, it } from 'vitest';
import type { Episode, WiringVariant } from '@/content/types';
import ep3Json from '@/content/episodes/ep3.json';
import type { Level } from '@/types/domain';
import { checkWiring, hasStage2, resolveBonus, resolveChallenge } from './challenges';
import { needsTransmission, spokenClueFor } from './progress';
import { wiringSolutions } from './wiring';

const ep3 = ep3Json as unknown as Episode;
const LEVELS: Level[] = ['A', 'B', 'C'];
const SLOTS = [0, 1, 2, 'vault'] as const;

describe('Ep. 3 (ENIAC) é resolvível nos 3 níveis, dos dois lados', () => {
  for (const side of ['red', 'blue'] as const)
    for (const lv of LEVELS)
      it(`${side} ${lv}`, () => {
        expect(SLOTS.every((s) => hasStage2(ep3, side, s))).toBe(true);
        const all = SLOTS.flatMap((s) => [
          resolveChallenge(ep3, side, lv, s, 0),
          resolveChallenge(ep3, side, lv, s, 1),
        ]);
        all.push(resolveBonus(ep3, side, lv)!);
        for (const ch of all) {
          if (ch.type !== 'wiring') continue;
          const v = ch.variant;
          const sols = wiringSolutions(v.start, v.modules, v.slots, v.target);
          expect(sols, ch.key).toHaveLength(1);
          expect(checkWiring(v, sols[0]!, v.start)).toBe(true);
          // entrada errada (ouviu mal o rádio) não passa
          expect(checkWiring(v, sols[0]!, v.start + 1)).toBe(false);
          // peça que não existe no painel não passa
          expect(
            checkWiring(
              v,
              sols[0]!.map(() => '+99'),
              v.start,
            ),
          ).toBe(false);
          if (v.mode === 'debug') expect(checkWiring(v, v.chain!, v.start)).toBe(false);
        }
      });
});

describe('Ep. 3: entrada falada (RN-45)', () => {
  it('o cadeado 3 espera a transmissão e a etapa 2 usa a mesma entrada', () => {
    for (const side of ['red', 'blue'] as const)
      for (const lv of LEVELS) {
        const s1 = resolveChallenge(ep3, side, lv, 2, 0);
        const s2 = resolveChallenge(ep3, side, lv, 2, 1);
        expect(needsTransmission(s1)).toBe(true);
        expect((s2.variant as WiringVariant).start).toBe((s1.variant as WiringVariant).start);
        const say = spokenClueFor(ep3.narratorScript, lv, s1.key);
        expect(say).toMatch(new RegExp(`\\b${(s1.variant as WiringVariant).start}\\b`));
        expect(needsTransmission(resolveChallenge(ep3, side, lv, 'vault'))).toBe(false);
      }
  });
});

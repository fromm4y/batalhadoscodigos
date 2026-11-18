import { describe, expect, it } from 'vitest';
import type { BoardChoiceVariant, CoopEpisode } from '@/content/types';
import ep5Json from '@/content/episodes/ep5.json';
import type { Level } from '@/types/domain';
import { bestMoves } from './boardGames';
import {
  checkBoardChoice,
  checkGameTree,
  hasStage2,
  resolveBonus,
  resolveChallenge,
} from './challenges';
import { asVersus } from './coop';
import { needsTransmission, spokenClueFor } from './progress';

const ep5 = asVersus(ep5Json as unknown as CoopEpisode);
const LEVELS: Level[] = ['A', 'B', 'C'];
const SLOTS = [0, 1, 2, 'vault'] as const;

describe('Ep. 5 (Deep Blue) é resolvível nos 3 níveis', () => {
  for (const lv of LEVELS)
    it(lv, () => {
      expect(SLOTS.every((s) => hasStage2(ep5, 'red', s))).toBe(true);
      const all = SLOTS.flatMap((s) => [
        resolveChallenge(ep5, 'red', lv, s, 0),
        resolveChallenge(ep5, 'red', lv, s, 1),
      ]);
      all.push(resolveBonus(ep5, 'red', lv)!);
      for (const ch of all) {
        if (ch.type === 'boardChoice') {
          expect(checkBoardChoice(ch.variant, ch.variant.answer), ch.key).toBe(true);
          const wrong = [...Array(9).keys()].find(
            (i) => i !== ch.variant.answer && ch.variant.board[i] === '.',
          )!;
          expect(checkBoardChoice(ch.variant, wrong)).toBe(false);
        }
        if (ch.type === 'gameTree') {
          const [best] = bestMoves(ch.variant.tree);
          expect(best, ch.key).toBe(ch.variant.answer);
          expect(checkGameTree(ch.variant, best!)).toBe(true);
          const other = Object.keys(ch.variant.tree).find((m) => m !== best)!;
          expect(checkGameTree(ch.variant, other)).toBe(false);
        }
      }
    });
});

describe('Ep. 5: jogada falada (RN-45)', () => {
  it('o cadeado 3 espera a transmissão; a etapa 2 já mostra a jogada', () => {
    for (const lv of LEVELS) {
      const s1 = resolveChallenge(ep5, 'red', lv, 2, 0);
      const s2 = resolveChallenge(ep5, 'red', lv, 2, 1);
      expect(needsTransmission(s1)).toBe(true);
      expect(needsTransmission(s2)).toBe(false);
      // a Narradora fala a casa de 1 a 9 (o JSON usa 0 a 8)
      const v = s1.variant as BoardChoiceVariant;
      expect(spokenClueFor(ep5.narratorScript, lv, s1.key)).toMatch(
        new RegExp(`casa ${v.spokenMove.cell + 1}\\b`),
      );
    }
  });
  it('A e B com apoio ao vivo; o C sem', () => {
    for (const slot of [2, 'vault'] as const)
      for (const step of [0, 1] as const) {
        const v = (lv: Level) =>
          resolveChallenge(ep5, 'red', lv, slot, step).variant as { livePreview?: boolean };
        expect(v('A').livePreview && v('B').livePreview).toBe(true);
        expect(v('C').livePreview).toBeFalsy();
      }
  });
});

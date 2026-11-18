import { describe, expect, it } from 'vitest';
import type { Episode, PriorityVariant } from '@/content/types';
import ep4Json from '@/content/episodes/ep4.json';
import type { Level } from '@/types/domain';
import { hasStage2, resolveBonus, resolveChallenge } from './challenges';
import { bestBudgetValue, checkBudget, checkSelect, selectionCost } from './priority';
import { needsTransmission, spokenClueFor } from './progress';

const ep4 = ep4Json as unknown as Episode;
const LEVELS: Level[] = ['A', 'B', 'C'];
const SLOTS = [0, 1, 2, 'vault'] as const;

/** Todas as combinações de tarefas (poucas tarefas: força bruta). */
function subsets(ids: string[]): string[][] {
  return Array.from({ length: 1 << ids.length }, (_, m) => ids.filter((_, i) => m & (1 << i)));
}

describe('Ep. 4 (Apollo 11) é resolvível nos 3 níveis, dos dois lados', () => {
  for (const side of ['red', 'blue'] as const)
    for (const lv of LEVELS)
      it(`${side} ${lv}`, () => {
        expect(SLOTS.every((s) => hasStage2(ep4, side, s))).toBe(true);
        const all = SLOTS.flatMap((s) => [
          resolveChallenge(ep4, side, lv, s, 0),
          resolveChallenge(ep4, side, lv, s, 1),
        ]);
        all.push(resolveBonus(ep4, side, lv)!);
        for (const ch of all) {
          if (ch.type !== 'priority') continue;
          const v = ch.variant;
          const ids = v.tasks.map((t) => t.id);
          if (v.mode === 'select') {
            expect(checkSelect(v.correct!, v.correct!), ch.key).toBe(true);
            // a mais ou a menos não passa
            expect(checkSelect(v.correct!, v.correct!.slice(1))).toBe(false);
            const extra = ids.find((id) => !v.correct!.includes(id))!;
            expect(checkSelect(v.correct!, [...v.correct!, extra])).toBe(false);
            continue;
          }
          const best = bestBudgetValue(v.tasks, v.capacity!);
          expect(best, ch.key).toBe(v.optimalValue);
          // qualquer combinação ótima que cabe vale; abaixo do ótimo, não
          const fit = subsets(ids).filter((s) => selectionCost(v.tasks, s) <= v.capacity!);
          const winners = fit.filter((s) => checkBudget(v.tasks, v.capacity!, best, s));
          expect(winners.length, ch.key).toBeGreaterThan(0);
          expect(winners.length, `${ch.key}: não pode ter combinações demais`).toBeLessThanOrEqual(3);
          // etapa 2 do Cofre no C: o "guloso" (melhor estrela por custo primeiro) não basta
          if (lv === 'C' && ch.key.endsWith('vault-2')) {
            const greedy = [...v.tasks]
              .sort((a, b) => b.value! / b.cost! - a.value! / a.cost!)
              .reduce<string[]>(
                (acc, t) =>
                  selectionCost(v.tasks, [...acc, t.id]) <= v.capacity! ? [...acc, t.id] : acc,
                [],
              );
            expect(checkBudget(v.tasks, v.capacity!, best, greedy), `${ch.key}: guloso`).toBe(
              false,
            );
          }
        }
      });
});

describe('Ep. 4: quantidade falada (RN-45)', () => {
  it('o cadeado 3 espera a transmissão e a etapa 2 usa a mesma quantidade', () => {
    for (const side of ['red', 'blue'] as const)
      for (const lv of LEVELS) {
        const s1 = resolveChallenge(ep4, side, lv, 2, 0);
        const s2 = resolveChallenge(ep4, side, lv, 2, 1);
        expect(needsTransmission(s1)).toBe(true);
        expect((s2.variant as PriorityVariant).pick).toBe((s1.variant as PriorityVariant).pick);
        const say = spokenClueFor(ep4.narratorScript, lv, s1.key);
        expect(say).toMatch(new RegExp(`\\b${(s1.variant as PriorityVariant).pick}\\b`));
        expect(needsTransmission(resolveChallenge(ep4, side, lv, 'vault'))).toBe(false);
      }
  });
  it('A e B têm apoio ao vivo (meta de estrelas) no Cofre; o C não', () => {
    for (const side of ['red', 'blue'] as const)
      for (const step of [0, 1] as const) {
        const v = (lv: Level) =>
          resolveChallenge(ep4, side, lv, 'vault', step).variant as PriorityVariant;
        expect(v('A').livePreview && v('B').livePreview).toBe(true);
        expect(v('C').livePreview).toBeFalsy();
      }
  });
});

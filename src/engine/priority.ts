import type { PriorityTask } from '@/content/types';

/** Console da Apollo (Ep. 4, SPEC-03 §3). */
export function selectionCost(tasks: readonly PriorityTask[], ids: readonly string[]): number {
  return tasks.filter((t) => ids.includes(t.id)).reduce((s, t) => s + (t.cost ?? 0), 0);
}
export function selectionValue(tasks: readonly PriorityTask[], ids: readonly string[]): number {
  return tasks.filter((t) => ids.includes(t.id)).reduce((s, t) => s + (t.value ?? 0), 0);
}

/** Melhor total de estrelas que cabe no limite (força bruta: poucas tarefas). */
export function bestBudgetValue(tasks: readonly PriorityTask[], capacity: number): number {
  let best = 0;
  const n = tasks.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    let cost = 0;
    let value = 0;
    for (let i = 0; i < n; i++)
      if (mask & (1 << i)) {
        cost += tasks[i]!.cost ?? 0;
        value += tasks[i]!.value ?? 0;
      }
    if (cost <= capacity) best = Math.max(best, value);
  }
  return best;
}

/** budget: qualquer combinação que caiba no limite e alcance o ótimo está certa. */
export function checkBudget(
  tasks: readonly PriorityTask[],
  capacity: number,
  optimal: number,
  ids: readonly string[],
): boolean {
  return selectionCost(tasks, ids) <= capacity && selectionValue(tasks, ids) === optimal;
}

/** select: o conjunto escolhido é exatamente o correto. */
export function checkSelect(correct: readonly string[], ids: readonly string[]): boolean {
  return ids.length === correct.length && correct.every((c) => ids.includes(c));
}

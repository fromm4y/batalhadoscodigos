/** Painel do ENIAC (Ep. 3, SPEC-03 §2): módulos "+3", "x2", "-1" aplicados em sequência, em decimal. */
export function applyModule(value: number, mod: string): number {
  const op = mod[0];
  const n = Number(mod.slice(1));
  if (!Number.isFinite(n)) throw new Error(`módulo inválido: ${mod}`);
  if (op === '+') return value + n;
  if (op === '-') return value - n;
  if (op === 'x' || op === '×' || op === '*') return value * n;
  throw new Error(`módulo inválido: ${mod}`);
}

/** Valores depois de cada módulo (para a animação "2 → +3 → 5 → ×2 → 10"). */
export function runSteps(start: number, chain: readonly string[]): number[] {
  const out: number[] = [];
  let v = start;
  for (const m of chain) {
    v = applyModule(v, m);
    out.push(v);
  }
  return out;
}

export const runChain = (start: number, chain: readonly string[]) =>
  chain.reduce(applyModule, start);

/** Todas as ordens de `slots` módulos (sem repetir peça) que chegam no alvo. */
export function wiringSolutions(
  start: number,
  modules: readonly string[],
  slots: number,
  target: number,
): string[][] {
  const sols = new Set<string>();
  const used = new Array<boolean>(modules.length).fill(false);
  const pick: string[] = [];
  const go = () => {
    if (pick.length === slots) {
      if (runChain(start, pick) === target) sols.add(pick.join(' '));
      return;
    }
    modules.forEach((m, i) => {
      if (used[i]) return;
      used[i] = true;
      pick.push(m);
      go();
      pick.pop();
      used[i] = false;
    });
  };
  go();
  return [...sols].map((s) => s.split(' '));
}

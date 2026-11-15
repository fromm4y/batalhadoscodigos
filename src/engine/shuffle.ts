/** Aleatório com semente (o mesmo resultado sempre para a mesma dupla e desafio). */
export function seededRng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Ordem de exibição das alternativas (pedido da May, 15/11): cada dupla vê as opções numa
 * ordem própria, então "é a primeira!" dito em voz alta não ajuda o vizinho.
 * Devolve os índices ORIGINAIS na ordem em que aparecem.
 */
export function optionOrder(count: number, seed: string): number[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => i),
    seededRng(seed),
  );
}

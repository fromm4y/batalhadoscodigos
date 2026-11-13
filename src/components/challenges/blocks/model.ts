import type { BlockNode, BlockSymbol, Program } from '@/content/types';

/** Nó do editor (com id estável para o React). Convertido para Program na hora de executar. */
export type EditorNode =
  | { id: string; type: 'weave'; symbol: BlockSymbol }
  | { id: string; type: 'repeat'; times: number; body: EditorNode[] };

let counter = 0;
export const newId = () => `n${++counter}`;

export const SYMBOL_INFO: Record<BlockSymbol, { glyph: string; label: string; color: string }> = {
  star: { glyph: '★', label: 'estrela', color: '#D4A537' },
  dot: { glyph: '●', label: 'bolinha', color: '#2F6BFF' },
  line: { glyph: '▬', label: 'linha', color: '#E63946' },
};

export const MIN_TIMES = 1;
export const MAX_TIMES = 9;

export function toProgram(nodes: EditorNode[]): Program {
  return nodes.map((n): BlockNode =>
    n.type === 'weave'
      ? { type: 'weave', symbol: n.symbol }
      : { type: 'repeat', times: n.times, body: toProgram(n.body) },
  );
}

export function fromProgram(program: Program): EditorNode[] {
  return program.map((n): EditorNode =>
    n.type === 'weave'
      ? { id: newId(), type: 'weave', symbol: n.symbol }
      : { id: newId(), type: 'repeat', times: n.times, body: fromProgram(n.body) },
  );
}

/** Aplica `fn` à lista de filhos do contêiner `containerId` ('root' = programa principal). */
export function updateContainer(
  nodes: EditorNode[],
  containerId: string,
  fn: (children: EditorNode[]) => EditorNode[],
): EditorNode[] {
  if (containerId === 'root') return fn(nodes);
  return nodes.map((n) =>
    n.type === 'repeat'
      ? n.id === containerId
        ? { ...n, body: fn(n.body) }
        : { ...n, body: updateContainer(n.body, containerId, fn) }
      : n,
  );
}

/** Atualiza um nó pelo id, em qualquer profundidade. */
export function updateNode(
  nodes: EditorNode[],
  id: string,
  fn: (n: EditorNode) => EditorNode | null,
): EditorNode[] {
  const out: EditorNode[] = [];
  for (const n of nodes) {
    if (n.id === id) {
      const r = fn(n);
      if (r) out.push(r);
    } else if (n.type === 'repeat') out.push({ ...n, body: updateNode(n.body, id, fn) });
    else out.push(n);
  }
  return out;
}

/** Profundidade de um contêiner (root = 0, dentro de um repeat = 1...). */
export function containerDepth(nodes: EditorNode[], containerId: string, depth = 0): number | null {
  if (containerId === 'root') return 0;
  for (const n of nodes) {
    if (n.type !== 'repeat') continue;
    if (n.id === containerId) return depth + 1;
    const d = containerDepth(n.body, containerId, depth + 1);
    if (d !== null) return d;
  }
  return null;
}

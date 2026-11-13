/**
 * Mini-linguagem de blocos do tear (SPEC 11.3).
 * run(program) expande as repetições em ordem e devolve os símbolos tecidos.
 */
import type { BlockNode, BlockSymbol, Program } from '@/content/types';

/** Limite de segurança para não travar o navegador com repetições enormes. */
export const MAX_OUTPUT = 200;

export function run(program: Program): BlockSymbol[] {
  const out: BlockSymbol[] = [];
  const exec = (nodes: BlockNode[]) => {
    for (const n of nodes) {
      if (out.length >= MAX_OUTPUT) return;
      if (n.type === 'weave') out.push(n.symbol);
      else for (let i = 0; i < Math.max(0, n.times); i++) exec(n.body);
    }
  };
  exec(program);
  return out.slice(0, MAX_OUTPUT);
}

/** Conta todos os nós (inclusive `repeat`) para o limite `maxBlocks` (11.2). */
export function countNodes(program: Program): number {
  return program.reduce((sum, n) => sum + 1 + (n.type === 'repeat' ? countNodes(n.body) : 0), 0);
}

/** Profundidade máxima de repetições aninhadas (aninhar só no nível C). */
export function nestingDepth(program: Program): number {
  return program.reduce(
    (max, n) => Math.max(max, n.type === 'repeat' ? 1 + nestingDepth(n.body) : 0),
    0,
  );
}

export function sameSymbols(a: BlockSymbol[], b: BlockSymbol[]): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i]);
}

/**
 * blockDebug: a dupla só pode alterar blocos/contagens, sem adicionar nem remover (11.2).
 * Confere se `edited` tem a mesma estrutura de `original` e só mudou o que é permitido.
 */
export function respectsDebugEdits(
  original: Program,
  edited: Program,
  editable: 'symbols' | 'counts' | 'both',
): boolean {
  if (original.length !== edited.length) return false;
  return original.every((o, i) => {
    const e = edited[i];
    if (!e || e.type !== o.type) return false;
    if (o.type === 'weave' && e.type === 'weave') {
      return o.symbol === e.symbol || editable !== 'counts';
    }
    if (o.type === 'repeat' && e.type === 'repeat') {
      const countOk = o.times === e.times || editable !== 'symbols';
      return countOk && respectsDebugEdits(o.body, e.body, editable);
    }
    return false;
  });
}

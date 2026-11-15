/** Ep. 5 (SPEC-03 §4): jogo da velha e árvore de jogadas (minimax). */
export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export function placeMove(board: string, cell: number, symbol: 'X' | 'O'): string {
  if (board[cell] !== '.') throw new Error('casa ocupada');
  return board.slice(0, cell) + symbol + board.slice(cell + 1);
}

/** Casas que completariam 3 em linha para `symbol` (ameaças). */
export function threats(board: string, symbol: 'X' | 'O'): number[] {
  const out = new Set<number>();
  for (const line of LINES) {
    const mine = line.filter((i) => board[i] === symbol).length;
    const empty = line.filter((i) => board[i] === '.');
    if (mine === 2 && empty.length === 1) out.add(empty[0]!);
  }
  return [...out];
}

/** Jogadas de X que criam armadilha dupla (duas ameaças ao mesmo tempo). */
export function forkMoves(board: string): number[] {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) {
    if (board[c] !== '.') continue;
    if (threats(placeMove(board, c, 'X'), 'X').length >= 2) out.push(c);
  }
  return out;
}

type Tree = Record<string, number[] | Record<string, number[]>>;

/** Valor de cada primeira jogada: a máquina escolhe o MENOR; no nível 3, você o MAIOR. */
export function minimaxValues(tree: Tree): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [move, sub] of Object.entries(tree)) {
    out[move] = Array.isArray(sub)
      ? Math.min(...sub)
      : Math.min(...Object.values(sub).map((leaves) => Math.max(...leaves)));
  }
  return out;
}

export function bestMoves(tree: Tree): string[] {
  const v = minimaxValues(tree);
  const best = Math.max(...Object.values(v));
  return Object.keys(v).filter((k) => v[k] === best);
}

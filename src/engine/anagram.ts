/**
 * Peças do anagrama (SPEC 11.2). Embaralhamento com semente fixa: recarregar a página
 * mostra a mesma ordem para a mesma dupla.
 */
import type { AnagramVariant } from '@/content/types';

export type Tile = { id: string; char: string; word: number };
export type AnagramLayout = {
  /** tamanho de cada palavra */
  words: number[];
  /** letras já no lugar (perWordFirstFixed): `${palavra}-${posição}` → letra */
  fixed: Record<string, string>;
  /** peças para arrastar/clicar; `word` = palavra onde a peça pode entrar (-1 = qualquer) */
  tray: Tile[];
};

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Embaralha garantindo que não fique igual ao original (quando dá). */
function scramble<T>(arr: T[], rand: () => number, same: (a: T[]) => boolean): T[] {
  for (let i = 0; i < 12; i++) {
    const s = shuffle(arr, rand);
    if (!same(s)) return s;
  }
  return shuffle(arr, rand);
}

export function buildAnagram(v: AnagramVariant, seed: string): AnagramLayout {
  const rand = rng(seed);
  const words = v.answer.split(/\s+/).map((w) => [...w]);
  const fixed: Record<string, string> = {};
  let tray: Tile[] = [];

  if (v.mode === 'whole') {
    const all = words.flatMap((w, wi) =>
      w.map((ch, ci) => ({ id: `${wi}-${ci}`, char: ch, word: -1 })),
    );
    tray = scramble(
      all,
      rand,
      (s) => s.map((t) => t.char).join('') === all.map((t) => t.char).join(''),
    );
  } else {
    words.forEach((w, wi) => {
      const start = v.mode === 'perWordFirstFixed' ? 1 : 0;
      if (start === 1 && w[0]) fixed[`${wi}-0`] = w[0];
      const pieces = w
        .slice(start)
        .map((ch, ci) => ({ id: `${wi}-${ci + start}`, char: ch, word: wi }));
      tray.push(
        ...scramble(
          pieces,
          rand,
          (s) => s.map((t) => t.char).join('') === pieces.map((t) => t.char).join(''),
        ),
      );
    });
  }
  return { words: words.map((w) => w.length), fixed, tray };
}

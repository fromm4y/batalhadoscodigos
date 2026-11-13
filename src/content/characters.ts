/**
 * Personagens-imagem para as duplas (pedido da May, 13/11): a dupla escolhe quem quer ser e o
 * jogo troca sozinho a versão Bando/Piratas. Arte: `avatar-{id}-bando` e `avatar-{id}-piratas`
 * (lista em docs/IMAGENS.md). Sem browser: a API valida contra esta lista.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export const CHARACTER_GROUPS = ['menina', 'menino'] as const;
export type CharacterGroup = (typeof CHARACTER_GROUPS)[number];

export const CHARACTERS_PER_GROUP = 12;

export const CHARACTER_IDS = CHARACTER_GROUPS.flatMap((g) =>
  Array.from({ length: CHARACTERS_PER_GROUP }, (_, i) => `${g}-${pad(i + 1)}`),
);

export function isCharacterId(v: unknown): v is string {
  return typeof v === 'string' && CHARACTER_IDS.includes(v);
}

/** Id da arte do personagem no lado (sem lado ainda = versão Bando). */
export function characterArtId(id: string, side: 'red' | 'blue' | null): string {
  return `avatar-${id}-${side === 'blue' ? 'piratas' : 'bando'}`;
}

/** Mapa id → URL das ilustrações em src/assets/** (ver docs/IMAGENS.md). */
const files = import.meta.glob<string>('/src/assets/**/*.{webp,png,jpg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byId = new Map<string, string>(
  Object.entries(files).map(([path, url]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.\w+$/, ''),
    url,
  ]),
);

/** Busca a ilustração pelo id; se não houver, tenta a versão `-neutra`/`-neutro` do personagem. */
export function artUrl(id: string): string | undefined {
  return byId.get(id) ?? byId.get(`${id}-neutra`) ?? byId.get(`${id}-neutro`);
}

export function hasArt(id: string): boolean {
  return artUrl(id) !== undefined;
}

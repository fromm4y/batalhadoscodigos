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

export function hasArt(id: string): boolean {
  return byId.has(id);
}

export function artUrl(id: string): string | undefined {
  return byId.get(id);
}

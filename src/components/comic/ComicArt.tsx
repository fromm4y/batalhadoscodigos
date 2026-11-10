import { cn } from './cn';

/**
 * Ilustrações dos quadros (ids de `art` no JSON do episódio).
 * A May gera as imagens e coloca em src/assets/comic/<id>.webp (ver docs/IMAGENS.md).
 * Enquanto a imagem não existe, aparece um placeholder estilizado.
 */
const files = import.meta.glob<string>('/src/assets/comic/*.{webp,png,jpg,svg}', {
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

type ComicArtProps = { id: string; alt: string; className?: string };

export function ComicArt({ id, alt, className }: ComicArtProps) {
  const url = byId.get(id);
  if (url) {
    return <img src={url} alt={alt} className={cn('h-full w-full object-cover', className)} />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'grid h-full min-h-32 w-full place-items-center bg-halftone-gold text-center text-ink',
        className,
      )}
    >
      <span className="rotate-[-3deg] border-[3px] border-ink bg-paper px-3 py-1 font-comic text-xl tracking-wider shadow-comic-sm">
        🎨 {id}
      </span>
    </div>
  );
}

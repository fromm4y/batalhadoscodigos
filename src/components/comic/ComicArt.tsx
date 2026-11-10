import type { ReactNode } from 'react';
import { artUrl } from './artRegistry';
import { cn } from './cn';

/**
 * Ilustrações por id (ids de `art` no JSON e de docs/IMAGENS.md).
 * A May gera as imagens; enquanto não existem, aparece um placeholder noir
 * (ou o `fallback` em SVG, quando o componente fornece um).
 */
type ComicArtProps = { id: string; alt: string; className?: string; fallback?: ReactNode };

export function ComicArt({ id, alt, className, fallback }: ComicArtProps) {
  const url = artUrl(id);
  if (url) {
    return <img src={url} alt={alt} className={cn('h-full w-full object-cover', className)} />;
  }
  if (fallback) {
    return (
      <div role="img" aria-label={alt} className={cn('relative h-full w-full', className)}>
        {fallback}
        <span className="absolute right-2 bottom-2 border-2 border-ink bg-paper/90 px-2 font-type text-xs text-ink">
          🎨 {id}
        </span>
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'grid h-full min-h-32 w-full place-items-center bg-graphite-dots text-center',
        className,
      )}
    >
      <span className="-rotate-2 border-2 border-dashed border-brass px-3 py-1 font-type text-base text-brass">
        🎨 {id}
      </span>
    </div>
  );
}

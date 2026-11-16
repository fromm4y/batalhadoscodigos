import { Link } from 'react-router';
import { cn } from '@/components/comic';

/** Atalho para o Álbum do Museu (lobby, telas de espera e fim do episódio). */
export function AlbumLink({ count, className }: { count?: number; className?: string }) {
  return (
    <Link
      to="/album"
      className={cn(
        'inline-flex min-h-11 items-center gap-2 border-[3px] border-ink bg-brass px-4 pt-1 font-heist text-xl tracking-wider text-ink shadow-comic-sm hover:glow-brass',
        className,
      )}
    >
      🃏 Álbum do Museu{count !== undefined ? ` (${count})` : ''}
    </Link>
  );
}

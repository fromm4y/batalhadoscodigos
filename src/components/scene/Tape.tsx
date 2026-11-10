import { cn } from '@/components/comic';

/** Pedaço de fita adesiva. */
export function Tape({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute z-10 h-6 w-20 bg-[rgb(237_227_204/0.55)] shadow-sm backdrop-blur-[1px] [clip-path:polygon(3%_0,97%_4%,100%_100%,0_94%)]',
        className,
      )}
    />
  );
}

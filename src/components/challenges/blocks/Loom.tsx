import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/components/comic';
import type { BlockSymbol } from '@/content/types';
import { SYMBOL_INFO } from './model';

/** Uma fileira de símbolos (padrão-alvo ou tecido). */
export function SymbolRow({
  symbols,
  mismatchFrom,
  size = 'md',
  label,
}: {
  symbols: BlockSymbol[];
  mismatchFrom?: number;
  size?: 'sm' | 'md';
  label: string;
}) {
  return (
    <ol
      className="flex flex-wrap gap-1"
      aria-label={`${label}: ${symbols.map((s) => SYMBOL_INFO[s].label).join(', ') || 'vazio'}`}
    >
      {symbols.map((s, i) => (
        <li
          key={i}
          aria-hidden
          className={cn(
            'grid place-items-center rounded-sm border-2 font-bold',
            size === 'md' ? 'h-9 w-9 text-xl' : 'h-7 w-7 text-base',
            mismatchFrom !== undefined && i >= mismatchFrom
              ? 'border-bando bg-bando/25'
              : 'border-ink/60 bg-white/70',
          )}
          style={{ color: SYMBOL_INFO[s].color }}
        >
          {SYMBOL_INFO[s].glyph}
        </li>
      ))}
    </ol>
  );
}

/**
 * O tear: mostra o padrão-alvo e "tece" a saída símbolo por símbolo (SPEC 11.3).
 * Chama `onDone(ok)` ao terminar a animação.
 */
export function Loom({
  target,
  output,
  playKey,
  onDone,
}: {
  target: BlockSymbol[];
  output: BlockSymbol[] | null;
  playKey: number;
  onDone?: (ok: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!output) return;
    const ok = output.length === target.length && output.every((s, i) => s === target[i]);
    if (reduce) {
      const t = setTimeout(() => {
        setShown(output.length);
        onDone?.(ok);
      }, 50);
      return () => clearTimeout(t);
    }
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= output.length) {
        clearInterval(t);
        setTimeout(() => onDone?.(ok), 350);
      }
    }, 180);
    return () => clearInterval(t);
    // playKey reinicia a animação; onDone muda a cada render do pai
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  const woven = output ? output.slice(0, shown) : [];
  const firstWrong = output ? woven.findIndex((s, i) => s !== target[i]) : -1;

  return (
    <div className="flex flex-col gap-2 rounded-hand border-[3px] border-ink bg-[#3b2a12] p-3 text-paper shadow-comic-sm">
      <p className="font-type text-xs uppercase text-brass">Padrão que o cofre espera</p>
      <SymbolRow symbols={target} label="Padrão-alvo" />
      <div className="relative mt-1 h-3 rounded-full bg-[#a8834a]">
        {output && !reduce && (
          <motion.span
            className="absolute -top-1 h-5 w-3 rounded-sm border-2 border-ink bg-brass"
            animate={{ left: ['0%', '96%', '0%'] }}
            transition={{ duration: 0.36, repeat: Infinity }}
          />
        )}
      </div>
      <p className="font-type text-xs uppercase text-brass">Tecido</p>
      <div className="min-h-9 rounded-sm bg-[repeating-linear-gradient(90deg,#d8c79e_0_3px,#cdb98b_3px_6px)] p-1">
        <SymbolRow
          symbols={woven}
          mismatchFrom={firstWrong >= 0 ? firstWrong : undefined}
          label="Tecido"
        />
      </div>
      {output && shown >= output.length && output.length !== target.length && (
        <p className="text-sm font-bold text-alert">
          O tear teceu {output.length} símbolo(s); o padrão tem {target.length}.
        </p>
      )}
    </div>
  );
}

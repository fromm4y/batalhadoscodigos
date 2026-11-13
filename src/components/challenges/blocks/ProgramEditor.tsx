import { motion } from 'framer-motion';
import { cn } from '@/components/comic';
import type { BlockSymbol } from '@/content/types';
import { MAX_TIMES, MIN_TIMES, SYMBOL_INFO, updateNode, type EditorNode } from './model';

export type EditorRules = {
  mode: 'build' | 'debug';
  /** debug: o que pode mudar */
  canEditSymbols: boolean;
  canEditCounts: boolean;
  /** símbolos possíveis ao trocar um bloco (debug) */
  symbols: BlockSymbol[];
};

type Props = {
  nodes: EditorNode[];
  onChange: (nodes: EditorNode[]) => void;
  rules: EditorRules;
  disabled?: boolean;
  /** build: contêiner onde os blocos da paleta entram */
  selected?: string;
  onSelect?: (containerId: string) => void;
  onDropBlock?: (containerId: string, block: string) => void;
};

/** Editor de programa do tear: blocos "Tecer" e "Repita N vezes" (aninháveis). */
export function ProgramEditor({
  nodes,
  onChange,
  rules,
  disabled,
  selected,
  onSelect,
  onDropBlock,
}: Props) {
  return (
    <Container
      id="root"
      label="Programa"
      nodes={nodes}
      all={nodes}
      onChange={onChange}
      rules={rules}
      disabled={disabled}
      selected={selected}
      onSelect={onSelect}
      onDropBlock={onDropBlock}
    />
  );
}

type ContainerProps = Props & { id: string; label: string; all: EditorNode[] };

function Container({
  id,
  label,
  nodes,
  all,
  onChange,
  rules,
  disabled,
  selected,
  onSelect,
  onDropBlock,
}: ContainerProps) {
  const build = rules.mode === 'build';
  const isSelected = build && selected === id;
  const move = (nodeId: string, dir: -1 | 1) => {
    const i = nodes.findIndex((n) => n.id === nodeId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= nodes.length) return;
    const reordered = [...nodes];
    [reordered[i], reordered[j]] = [reordered[j]!, reordered[i]!];
    // troca os filhos deste contêiner dentro da árvore toda
    onChange(
      id === 'root'
        ? reordered
        : updateNode(all, id, (n) => (n.type === 'repeat' ? { ...n, body: reordered } : n)),
    );
  };

  return (
    <div
      role={build ? 'group' : undefined}
      aria-label={label}
      onClick={(e) => {
        if (!build || disabled) return;
        e.stopPropagation();
        onSelect?.(id);
      }}
      onDragOver={(e) => build && e.preventDefault()}
      onDrop={(e) => {
        if (!build) return;
        e.preventDefault();
        e.stopPropagation();
        const block = e.dataTransfer.getData('text/plain');
        if (block) onDropBlock?.(id, block);
      }}
      className={cn(
        'flex min-h-14 flex-col gap-2 rounded-md p-2',
        id === 'root' ? 'bg-ink/5' : 'ml-4 border-l-4 border-brass/70 bg-brass/10',
        isSelected && 'outline-3 outline-dashed outline-brass',
        build && !disabled && 'cursor-pointer',
      )}
    >
      {nodes.length === 0 && (
        <p className="font-type text-sm text-ink/60">
          {build
            ? isSelected
              ? '⤵ Os blocos entram aqui'
              : 'Clique aqui para colocar blocos dentro'
            : 'vazio'}
        </p>
      )}
      {nodes.map((n, i) => (
        <motion.div
          key={n.id}
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {n.type === 'weave' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || !rules.canEditSymbols}
                onClick={(e) => {
                  e.stopPropagation();
                  const next =
                    rules.symbols[(rules.symbols.indexOf(n.symbol) + 1) % rules.symbols.length]!;
                  onChange(
                    updateNode(all, n.id, (x) => (x.type === 'weave' ? { ...x, symbol: next } : x)),
                  );
                }}
                aria-label={`Tecer ${SYMBOL_INFO[n.symbol].label}${rules.canEditSymbols && !build ? ' (clique para trocar)' : ''}`}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-md border-[3px] border-ink bg-white px-3 font-heist text-xl tracking-wide text-ink',
                  rules.canEditSymbols &&
                    !build &&
                    !disabled &&
                    'cursor-pointer ring-2 ring-brass hover:bg-spotlight',
                )}
              >
                Tecer
                <span
                  className="text-2xl"
                  style={{ color: SYMBOL_INFO[n.symbol].color }}
                  aria-hidden
                >
                  {SYMBOL_INFO[n.symbol].glyph}
                </span>
              </button>
              {build && (
                <NodeTools
                  onUp={() => move(n.id, -1)}
                  onDown={() => move(n.id, 1)}
                  first={i === 0}
                  last={i === nodes.length - 1}
                  onRemove={() => onChange(updateNode(all, n.id, () => null))}
                  disabled={disabled}
                />
              )}
            </div>
          ) : (
            <div className="rounded-md border-[3px] border-ink bg-brass/30 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heist text-xl tracking-wide text-ink">Repita</span>
                <Stepper
                  value={n.times}
                  disabled={disabled || !rules.canEditCounts}
                  highlight={!build && rules.canEditCounts}
                  onChange={(times) =>
                    onChange(
                      updateNode(all, n.id, (x) => (x.type === 'repeat' ? { ...x, times } : x)),
                    )
                  }
                />
                <span className="font-heist text-xl tracking-wide text-ink">vezes</span>
                {build && (
                  <NodeTools
                    onUp={() => move(n.id, -1)}
                    onDown={() => move(n.id, 1)}
                    first={i === 0}
                    last={i === nodes.length - 1}
                    onRemove={() => onChange(updateNode(all, n.id, () => null))}
                    disabled={disabled}
                  />
                )}
              </div>
              <Container
                id={n.id}
                label={`Dentro de Repita ${n.times} vezes`}
                nodes={n.body}
                all={all}
                onChange={onChange}
                rules={rules}
                disabled={disabled}
                selected={selected}
                onSelect={onSelect}
                onDropBlock={onDropBlock}
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function Stepper({
  value,
  onChange,
  disabled,
  highlight,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  const btn =
    'grid h-10 w-10 cursor-pointer place-items-center rounded-md border-[3px] border-ink bg-paper font-heist text-2xl text-ink disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-md', highlight && 'ring-2 ring-brass')}
    >
      <button
        type="button"
        aria-label="Menos uma vez"
        className={btn}
        disabled={disabled || value <= MIN_TIMES}
        onClick={(e) => {
          e.stopPropagation();
          onChange(value - 1);
        }}
      >
        −
      </button>
      <span
        className="grid h-10 w-10 place-items-center rounded-md border-[3px] border-ink bg-white font-heist text-2xl text-ink"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Mais uma vez"
        className={btn}
        disabled={disabled || value >= MAX_TIMES}
        onClick={(e) => {
          e.stopPropagation();
          onChange(value + 1);
        }}
      >
        +
      </button>
    </span>
  );
}

function NodeTools({
  onUp,
  onDown,
  onRemove,
  first,
  last,
  disabled,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  first: boolean;
  last: boolean;
  disabled?: boolean;
}) {
  const btn =
    'grid h-11 w-11 cursor-pointer place-items-center rounded-md border-2 border-ink/60 bg-paper text-lg text-ink hover:bg-spotlight disabled:opacity-30';
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <span className="ml-auto flex gap-1">
      <button
        type="button"
        aria-label="Subir bloco"
        className={btn}
        disabled={disabled || first}
        onClick={stop(onUp)}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label="Descer bloco"
        className={btn}
        disabled={disabled || last}
        onClick={stop(onDown)}
      >
        ↓
      </button>
      <button
        type="button"
        aria-label="Tirar bloco"
        className={cn(btn, 'text-bando')}
        disabled={disabled}
        onClick={stop(onRemove)}
      >
        ✕
      </button>
    </span>
  );
}

import { useState } from 'react';
import type {
  BlockBuildVariant,
  BlockDebugVariant,
  BlockSymbol,
  PaletteBlock,
} from '@/content/types';
import { countNodes, run } from '@/engine/blocks';
import { checkBlockBuild, checkBlockDebug } from '@/engine/challenges';
import type { Level } from '@/types/domain';
import { SubmitButton, type ChallengeBaseProps } from './common';
import { Loom } from './blocks/Loom';
import {
  containerDepth,
  fromProgram,
  newId,
  SYMBOL_INFO,
  toProgram,
  updateContainer,
  type EditorNode,
} from './blocks/model';
import { ProgramEditor } from './blocks/ProgramEditor';

type Weave = { output: BlockSymbol[]; key: number; ok: boolean };

/** blockBuild (Bando, Cofre): montar o programa que tece o padrão, com limite de blocos (11.2). */
export function BlockBuildChallenge({
  variant,
  level,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: BlockBuildVariant; level: Level }) {
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [selected, setSelected] = useState('root');
  const [weave, setWeave] = useState<Weave | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const used = countNodes(toProgram(nodes));
  const nestAllowed = level === 'C';

  function add(containerId: string, block: string) {
    if (locked || busy) return;
    setMsg(null);
    if (used >= variant.maxBlocks)
      return setMsg(`Limite de ${variant.maxBlocks} blocos! Tirem algum ou usem o Repita.`);
    const depth = containerDepth(nodes, containerId) ?? 0;
    if (block === 'repeat' && depth >= 1 && !nestAllowed) {
      return setMsg('Neste nível não dá para colocar um Repita dentro de outro.');
    }
    const node: EditorNode =
      block === 'repeat'
        ? { id: newId(), type: 'repeat', times: 2, body: [] }
        : { id: newId(), type: 'weave', symbol: block as BlockSymbol };
    setNodes((ns) => updateContainer(ns, containerId, (c) => [...c, node]));
    if (node.type === 'repeat') setSelected(node.id);
  }

  function tecer() {
    if (locked || busy) return;
    const program = toProgram(nodes);
    const r = checkBlockBuild(variant, program, level);
    if (r.reason === 'too_many') return setMsg(`Use no máximo ${variant.maxBlocks} blocos.`);
    if (r.reason === 'too_deep') return setMsg('Neste nível não dá para aninhar repetições.');
    setMsg(null);
    setBusy(true);
    setWeave({ output: run(program), key: Date.now(), ok: r.ok });
  }

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" aria-label="Blocos disponíveis">
          {variant.palette.map((b: PaletteBlock) => (
            <button
              key={b}
              type="button"
              draggable={!locked && !busy}
              onDragStart={(e) => e.dataTransfer.setData('text/plain', b)}
              onClick={() => add(selected, b)}
              disabled={locked || busy}
              className="flex min-h-11 cursor-grab items-center gap-2 rounded-md border-[3px] border-ink bg-white px-3 font-heist text-xl tracking-wide text-ink shadow-comic-sm hover:bg-spotlight disabled:opacity-50"
            >
              {b === 'repeat' ? (
                '🔁 Repita'
              ) : (
                <>
                  Tecer <span style={{ color: SYMBOL_INFO[b].color }}>{SYMBOL_INFO[b].glyph}</span>
                </>
              )}
            </button>
          ))}
          <span
            className={`ml-auto font-heist text-xl tracking-wider ${used > variant.maxBlocks ? 'text-bando' : 'text-ink'}`}
          >
            Blocos: {used}/{variant.maxBlocks}
          </span>
        </div>
        <p className="text-sm">
          Clique num bloco (ou arraste) para colocá-lo no programa. Clique dentro de um Repita para
          encher ele.
        </p>
        <ProgramEditor
          nodes={nodes}
          onChange={setNodes}
          rules={{
            mode: 'build',
            canEditSymbols: false,
            canEditCounts: true,
            symbols: ['star', 'dot', 'line'],
          }}
          disabled={locked || busy}
          selected={selected}
          onSelect={setSelected}
          onDropBlock={add}
        />
        {msg && (
          <p role="alert" className="font-bold text-bando-dark">
            {msg}
          </p>
        )}
      </div>
      {/* Botões embaixo do tear: no 1366×768 a coluna da esquerda fica livre para o programa. */}
      <div className="flex flex-col gap-3">
        <Loom
          key={weave?.key ?? 0}
          target={variant.target}
          output={weave?.output ?? null}
          playKey={weave?.key ?? 0}
          onDone={(ok) => {
            setBusy(false);
            if (ok) onSolved();
            else onWrong();
          }}
        />
        <div className="flex gap-3">
          <SubmitButton icon="🧵" onClick={tecer} disabled={locked || busy || nodes.length === 0}>
            Tecer!
          </SubmitButton>
          <button
            type="button"
            disabled={locked || busy}
            onClick={() => {
              setNodes([]);
              setSelected('root');
              setWeave(null);
            }}
            className="min-h-12 cursor-pointer border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink"
          >
            ⟲ Recomeçar
          </button>
        </div>
      </div>
    </div>
  );
}

/** blockDebug (Piratas, Cofre): achar e consertar o erro sem adicionar nem remover blocos (11.2). */
export function BlockDebugChallenge({
  variant,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: BlockDebugVariant }) {
  const [nodes, setNodes] = useState<EditorNode[]>(() => fromProgram(variant.program));
  const [weave, setWeave] = useState<Weave | null>(null);
  const [busy, setBusy] = useState(false);
  const symbols = [...new Set<BlockSymbol>(['star', 'dot', ...variant.target])];

  function tecer() {
    if (locked || busy) return;
    const program = toProgram(nodes);
    const r = checkBlockDebug(variant, program);
    setBusy(true);
    setWeave({ output: run(program), key: Date.now(), ok: r.ok });
  }

  const hint =
    variant.editable === 'symbols'
      ? 'Clique num bloco "Tecer" para trocar o símbolo.'
      : variant.editable === 'counts'
        ? 'Use o − e o + para mudar quantas vezes repete.'
        : 'Você pode trocar símbolos (clique no bloco) e contagens (− e +).';

  return (
    <div className="grid grid-cols-[1fr_1fr] gap-5">
      <div className="flex flex-col gap-3">
        <p className="text-sm">{hint} Não dá para colocar nem tirar blocos.</p>
        <ProgramEditor
          nodes={nodes}
          onChange={setNodes}
          rules={{
            mode: 'debug',
            canEditSymbols: variant.editable !== 'counts',
            canEditCounts: variant.editable !== 'symbols',
            symbols,
          }}
          disabled={locked || busy}
        />
      </div>
      {/* Botões embaixo do tear: no 1366×768 a coluna da esquerda fica livre para o programa. */}
      <div className="flex flex-col gap-3">
        <Loom
          key={weave?.key ?? 0}
          target={variant.target}
          output={weave?.output ?? null}
          playKey={weave?.key ?? 0}
          onDone={(ok) => {
            setBusy(false);
            if (ok) onSolved();
            else onWrong();
          }}
        />
        <div className="flex gap-3">
          <SubmitButton icon="🧵" onClick={tecer} disabled={locked || busy}>
            Testar o tear
          </SubmitButton>
          <button
            type="button"
            disabled={locked || busy}
            onClick={() => {
              setNodes(fromProgram(variant.program));
              setWeave(null);
            }}
            className="min-h-12 cursor-pointer border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink"
          >
            ⟲ Desfazer
          </button>
        </div>
      </div>
    </div>
  );
}

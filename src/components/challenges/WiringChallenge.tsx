import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/components/comic';
import type { WiringVariant } from '@/content/types';
import { checkWiring } from '@/engine/challenges';
import { optionOrder } from '@/engine/shuffle';
import { applyModule } from '@/engine/wiring';
import { SubmitButton, WaitingTransmission, type ChallengeBaseProps } from './common';

/** "x2" aparece como "×2". */
const label = (m: string) => m.replace(/^x/, '×');

/**
 * wiring (Ep. 3, SPEC-03 §2): o painel do ENIAC. Bando monta (`build`): coloca os módulos nos
 * encaixes. Piratas consertam (`debug`): os módulos já estão nos encaixes e a dupla troca dois
 * de lugar (clica um, depois o outro). "Ligar a máquina" mostra a conta passo a passo.
 */
export function WiringChallenge({
  variant,
  heard,
  seed,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: WiringVariant; heard: boolean; seed: string }) {
  const reduce = useReducedMotion();
  const build = variant.mode === 'build';
  const waiting = variant.startSpoken === true && !heard;
  // peças com id (pode haver módulos iguais); a bandeja tem ordem própria de cada dupla
  const pieces = variant.modules.map((m, i) => ({ id: i, m }));
  const trayOrder = optionOrder(pieces.length, seed);
  const initialSlots = (): (number | null)[] => {
    if (build || !variant.chain) return Array.from({ length: variant.slots }, () => null);
    const used = new Set<number>();
    return variant.chain.map((m) => {
      const p = pieces.find((x) => x.m === m && !used.has(x.id))!;
      used.add(p.id);
      return p.id;
    });
  };
  const [slots, setSlots] = useState<(number | null)[]>(initialSlots);
  const [picked, setPicked] = useState<{
    where: 'slot' | 'tray';
    id: number;
    slot?: number;
  } | null>(null);
  const [typedStart, setTypedStart] = useState('');
  const [trace, setTrace] = useState<number[] | null>(null);
  const [solved, setSolved] = useState(false);
  const busy = locked || solved || waiting;

  const start = variant.startSpoken ? Number(typedStart) : variant.start;
  const startOk = !variant.startSpoken || /^\d{1,3}$/.test(typedStart);
  const inTray = trayOrder.map((i) => pieces[i]!).filter((p) => !slots.includes(p.id));
  const complete = slots.every((s) => s !== null);

  function reset() {
    setSlots(initialSlots());
    setPicked(null);
    setTrace(null);
  }

  function clickTray(id: number) {
    if (busy) return;
    setTrace(null);
    if (build) {
      // montar: vai para o primeiro encaixe livre
      const free = slots.indexOf(null);
      if (free >= 0) setSlots(slots.map((s, i) => (i === free ? id : s)));
      return;
    }
    // consertar: peça sobrando troca com o encaixe escolhido
    if (picked?.where === 'slot' && picked.slot !== undefined) {
      setSlots(slots.map((s, i) => (i === picked.slot ? id : s)));
      setPicked(null);
    } else setPicked({ where: 'tray', id });
  }

  function clickSlot(i: number) {
    if (busy) return;
    setTrace(null);
    const here = slots[i];
    if (build) {
      if (here !== null) setSlots(slots.map((s, k) => (k === i ? null : s)));
      return;
    }
    if (!picked) return setPicked({ where: 'slot', id: here!, slot: i });
    if (picked.where === 'slot' && picked.slot !== undefined) {
      const j = picked.slot;
      setSlots(slots.map((s, k) => (k === i ? (slots[j] ?? null) : k === j ? (here ?? null) : s)));
    } else if (picked.where === 'tray') {
      setSlots(slots.map((s, k) => (k === i ? picked.id : s)));
    }
    setPicked(null);
  }

  function powerOn() {
    if (busy || !complete || !startOk) return;
    const chain = slots.map((id) => pieces[id!]!.m);
    const values: number[] = [];
    chain.reduce((v, m) => {
      const next = applyModule(v, m);
      values.push(next);
      return next;
    }, start);
    setTrace(values);
    if (!checkWiring(variant, chain, start)) return onWrong();
    setSolved(true);
    setTimeout(onSolved, 900);
  }

  const out = trace?.at(-1);
  // 17/11 (mais fácil, A e B): conta parcial ao vivo nos encaixes já preenchidos, em sequência
  const live: (number | undefined)[] = [];
  if (variant.livePreview && startOk && !waiting) {
    let acc = start;
    for (const id of slots) {
      if (id === null) break;
      acc = applyModule(acc, pieces[id]!.m);
      live.push(acc);
    }
  }
  return (
    <div className="flex flex-col gap-3">
      {waiting && <WaitingTransmission />}
      {/* armário do ENIAC: entrada → encaixes → saída */}
      <div
        className="relative flex flex-wrap items-center gap-2 rounded-md border-[3px] border-ink bg-[linear-gradient(180deg,#2a2f3b,#171b26)] p-3"
        aria-label="Painel do ENIAC"
      >
        <Socket title="Entrada">
          {variant.startSpoken ? (
            waiting ? (
              <span className="font-heist text-3xl text-brass">🎧 ?</span>
            ) : (
              <input
                value={typedStart}
                onChange={(e) => setTypedStart(e.target.value.replace(/\D/g, '').slice(0, 3))}
                disabled={busy}
                inputMode="numeric"
                aria-label="Número de entrada que a Narradora falou"
                placeholder="?"
                className="h-11 w-16 border-[3px] border-ink bg-white text-center font-heist text-3xl text-ink"
              />
            )
          ) : (
            <span className="font-heist text-4xl text-spotlight">{variant.start}</span>
          )}
        </Socket>
        {slots.map((id, i) => {
          const p = id !== null ? pieces[id] : null;
          const selected = picked?.where === 'slot' && picked.slot === i;
          const val = trace?.[i];
          return (
            <div key={i} className="flex items-center gap-2">
              <Cable lit={!!trace} delay={i * 0.25} reduce={!!reduce} />
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => clickSlot(i)}
                  aria-label={`Encaixe ${i + 1}: ${p ? label(p.m) : 'vazio'}${selected ? ', escolhido para trocar' : ''}`}
                  className={cn(
                    'grid h-16 w-16 cursor-pointer place-items-center rounded-md border-[3px] font-heist text-3xl disabled:cursor-not-allowed',
                    p
                      ? 'border-ink bg-brass text-ink shadow-comic-sm'
                      : 'border-dashed border-brass/60 bg-night/60 text-mist',
                    selected && 'outline-4 outline-spotlight',
                  )}
                >
                  {p ? label(p.m) : '·'}
                </button>
                <span
                  className={cn(
                    'mt-1 h-6 font-heist text-xl',
                    val !== undefined
                      ? 'text-spotlight'
                      : live[i] !== undefined
                        ? 'text-mist'
                        : 'text-transparent',
                  )}
                >
                  {val ?? live[i] ?? '0'}
                </span>
              </div>
            </div>
          );
        })}
        <Cable lit={!!trace} delay={slots.length * 0.25} reduce={!!reduce} />
        <Socket title="Saída">
          <span
            className={cn(
              'font-heist text-4xl',
              out === undefined
                ? 'text-mist'
                : out === variant.target
                  ? 'text-success'
                  : 'text-alert',
            )}
          >
            {out ?? '?'}
          </span>
          <span className="font-type text-xs text-mist">alvo: {variant.target}</span>
        </Socket>
      </div>

      {inTray.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Módulos do painel">
          <span className="font-type text-sm">{build ? 'Módulos:' : 'Sobrando:'}</span>
          {inTray.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={busy}
              onClick={() => clickTray(p.id)}
              aria-label={`Módulo ${label(p.m)}`}
              className={cn(
                'grid h-14 w-16 cursor-pointer place-items-center rounded-md border-[3px] border-ink bg-paper font-heist text-3xl text-ink shadow-comic-sm hover:bg-spotlight disabled:cursor-not-allowed disabled:opacity-50',
                picked?.where === 'tray' && picked.id === p.id && 'outline-4 outline-spotlight',
              )}
            >
              {label(p.m)}
            </button>
          ))}
        </div>
      )}
      <p className="font-type text-sm">
        {build
          ? 'Clique num módulo para encaixar; clique no encaixe para tirar. A ordem importa!'
          : 'Clique num encaixe e depois em outro (ou num módulo sobrando) para trocar de lugar.'}
      </p>
      {trace && (
        <p className="font-type text-base" aria-live="polite">
          ⚡ {start}{' '}
          {trace
            .map((v, i) => `→ ${label(slots[i] !== null ? pieces[slots[i]!]!.m : '')} → ${v}`)
            .join(' ')}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <SubmitButton disabled={busy || !complete || !startOk} onClick={powerOn} icon="⚡">
          Ligar a máquina
        </SubmitButton>
        <button
          type="button"
          disabled={busy}
          onClick={reset}
          className="min-h-12 cursor-pointer border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink disabled:opacity-50"
        >
          ⟲ Recomeçar
        </button>
      </div>
    </div>
  );
}

function Socket({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-20 flex-col items-center gap-1 rounded-md border-[3px] border-ink bg-night px-2 py-1">
      <span className="font-type text-xs tracking-widest text-mist uppercase">{title}</span>
      {children}
    </div>
  );
}

function Cable({ lit, delay, reduce }: { lit: boolean; delay: number; reduce: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="h-1.5 w-6 rounded-full"
      initial={false}
      animate={{ backgroundColor: lit ? '#FFF4C2' : '#3a4152' }}
      transition={{ delay: lit && !reduce ? delay : 0, duration: reduce ? 0 : 0.2 }}
    />
  );
}

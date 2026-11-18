import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/components/comic';
import type { PriorityVariant } from '@/content/types';
import { checkBudget, checkSelect, selectionCost, selectionValue } from '@/engine/priority';
import { optionOrder } from '@/engine/shuffle';
import { SubmitButton, WaitingTransmission, type ChallengeBaseProps } from './common';

/** Ícone do limite: minutos (Bando), energia (Piratas), peso (missão bônus)... */
function costIcon(label: string | undefined): string {
  if (label?.startsWith('minuto')) return '⏱️';
  if (label?.startsWith('energia')) return '⚡';
  return '⚖️';
}

/**
 * priority (Ep. 4, SPEC-03 §3): o console de missão da Apollo, com o alarme 1202 piscando.
 * - `select`: chaves de liga/desliga; contador "x de N" (N só aparece depois da transmissão
 *   quando a quantidade é falada). Certo se o conjunto ligado é o das tarefas essenciais.
 * - `budget`: cada tarefa tem custo e estrelas; a barra do limite enche e não deixa passar.
 *   Certo se a soma de estrelas chega no máximo possível (qualquer combinação ótima vale).
 * A ordem das tarefas é embaralhada por dupla (pedido da May, 15/11).
 */
export function PriorityChallenge({
  variant,
  heard,
  seed,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: PriorityVariant; heard: boolean; seed: string }) {
  const reduce = useReducedMotion();
  const budget = variant.mode === 'budget';
  const waiting = !budget && variant.pickSpoken === true && !heard;
  const order = optionOrder(variant.tasks.length, seed).map((i) => variant.tasks[i]!);
  const [on, setOn] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const busy = locked || solved || waiting;

  const cap = variant.capacity ?? 0;
  const used = selectionCost(variant.tasks, on);
  const stars = selectionValue(variant.tasks, on);
  const pick = variant.pick ?? 0;
  const icon = costIcon(variant.capacityLabel);

  function canTurnOn(id: string): boolean {
    if (budget) return used + (variant.tasks.find((t) => t.id === id)?.cost ?? 0) <= cap;
    return on.length < pick;
  }
  function toggle(id: string) {
    if (busy) return;
    setFeedback(null);
    if (on.includes(id)) setOn(on.filter((x) => x !== id));
    else if (canTurnOn(id)) setOn([...on, id]);
  }

  function confirm() {
    if (busy || on.length === 0) return;
    const ok = budget
      ? checkBudget(variant.tasks, cap, variant.optimalValue ?? 0, on)
      : checkSelect(variant.correct ?? [], on);
    if (!ok) {
      const missing = (variant.optimalValue ?? 0) - stars;
      setFeedback(
        budget
          ? `Ainda dá para fazer melhor! Faltam ${missing} ${missing === 1 ? 'estrela' : 'estrelas'}.`
          : 'Ainda não! Alguma chave ligada não é essencial.',
      );
      return onWrong();
    }
    setSolved(true);
    setFeedback(null);
    setTimeout(onSolved, 900);
  }

  return (
    <div className="flex flex-col gap-3">
      {waiting && <WaitingTransmission />}
      <div
        className="flex flex-col gap-2 rounded-md border-[3px] border-ink bg-[linear-gradient(180deg,#2b2f28,#151812)] p-2.5"
        aria-label="Console de missão"
      >
        {/* letreiro: alarme 1202 piscando + contador (select) ou limite e estrelas (budget) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-2 border-ink bg-black px-3 py-1 font-type text-[#7CFF8A]">
          <motion.span
            className="font-heist text-2xl tracking-widest text-alert"
            animate={reduce || solved ? undefined : { opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
          >
            {solved ? '✔ PROGRAMA OK' : '🚨 ALARME 1202'}
          </motion.span>
          {budget ? (
            <CapacityBar
              used={used}
              cap={cap}
              icon={icon}
              label={variant.capacityLabel ?? ''}
              stars={stars}
              goal={variant.livePreview ? variant.optimalValue : undefined}
            />
          ) : (
            <p className="text-base" aria-live="polite">
              CHAVES LIGADAS: <strong className="font-heist text-2xl">{on.length}</strong> de{' '}
              <strong className="font-heist text-2xl">{waiting ? '?' : pick}</strong>
            </p>
          )}
        </div>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Tarefas">
          {order.map((t) => {
            const lit = on.includes(t.id);
            const blocked = !lit && !canTurnOn(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={lit}
                  disabled={busy || blocked}
                  onClick={() => toggle(t.id)}
                  aria-label={
                    budget
                      ? `${t.label}: custa ${t.cost} ${variant.capacityLabel ?? ''}, vale ${t.value} estrelas`
                      : t.label
                  }
                  className={cn(
                    'flex min-h-12 w-full cursor-pointer items-center gap-2.5 rounded-md border-[3px] border-ink px-2.5 py-1 text-left font-body text-base leading-tight font-bold shadow-comic-sm disabled:cursor-not-allowed',
                    lit ? 'bg-[#1f3d22] text-[#C9FFD0]' : 'bg-paper text-ink hover:bg-spotlight',
                    blocked && 'opacity-45',
                  )}
                >
                  <Lever on={lit} reduce={!!reduce} />
                  <span className="flex-1">{t.label}</span>
                  {budget && (
                    <span className="flex shrink-0 flex-col items-end font-heist text-lg leading-tight">
                      <span>
                        <span aria-hidden>{icon}</span> {t.cost}
                      </span>
                      <span>
                        <span aria-hidden>⭐</span> {t.value}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {feedback && (
        <p
          role="status"
          className="border-2 border-dashed border-alert bg-night/40 px-3 py-1.5 font-type text-paper"
        >
          {feedback}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={busy || on.length === 0} onClick={confirm} icon="🚀">
          Confirmar plano
        </SubmitButton>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setOn([]);
            setFeedback(null);
          }}
          className="min-h-12 cursor-pointer border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink disabled:opacity-50"
        >
          ⟲ Desligar tudo
        </button>
        <p className="max-w-80 font-type text-sm">
          {budget
            ? `Não passem do limite (${icon} ${cap}). Dá para trocar à vontade.`
            : 'Liguem só as chaves das tarefas essenciais.'}
        </p>
      </div>
    </div>
  );
}

/** Barra do limite (minutos/energia) + placar de estrelas ao vivo. */
function CapacityBar({
  used,
  cap,
  icon,
  label,
  stars,
  goal,
}: {
  used: number;
  cap: number;
  icon: string;
  label: string;
  stars: number;
  goal: number | undefined;
}) {
  const pct = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
  return (
    <div className="flex min-w-60 flex-1 flex-wrap items-center gap-3" aria-live="polite">
      <div className="flex min-w-40 flex-1 flex-col">
        <span className="text-sm tracking-widest uppercase">
          {icon} {label}: {used} de {cap}
        </span>
        <div
          className="h-3.5 w-full overflow-hidden rounded-full border-2 border-[#3a4152] bg-black"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={cap}
          aria-valuenow={used}
          aria-label={`${label} usados`}
        >
          <div
            className={cn('h-full transition-[width]', used === cap ? 'bg-brass' : 'bg-[#3BD45A]')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="font-heist text-2xl leading-none text-spotlight">
        ⭐ {stars}
        {goal !== undefined && <span className="text-xl text-mist"> / meta {goal}</span>}
      </span>
    </div>
  );
}

/** Alavanca de liga/desliga com luzinha (desenho em CSS). */
function Lever({ on, reduce }: { on: boolean; reduce: boolean }) {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1.5">
      <span className="relative h-8 w-4 rounded-sm border-2 border-ink bg-graphite">
        <motion.span
          className="absolute left-0 h-3.5 w-full rounded-sm bg-mist"
          initial={false}
          animate={{ top: on ? 1 : 13 }}
          transition={{ duration: reduce ? 0 : 0.15 }}
        />
      </span>
      <span
        className={cn(
          'h-3 w-3 rounded-full border-2 border-ink',
          on ? 'bg-[#3BD45A] shadow-[0_0_8px_#3BD45A]' : 'bg-[#3a2020]',
        )}
      />
    </span>
  );
}

/**
 * Pontuação da temporada (SPEC 7.6) e dicas (RN-29). Valores em GAME_RULES.
 */
import { GAME_RULES } from '@/config/gameRules';
import type { LedgerReason } from '@/types/domain';

const P = GAME_RULES.points;

/** Pontos fixos por motivo (o ajuste manual é livre e não passa por aqui). */
export const POINTS: Record<Exclude<LedgerReason, 'manual'>, number> = {
  lock_open: P.lockOpen,
  lock_first: P.lockFirstInClass,
  event_ok: P.museumEventOk,
  vault_win: P.vaultWin,
  draw: P.draw,
  side_bonus: P.sideBonus,
  wrong_answer: P.wrongAnswer,
  hint_1: P.hint1,
  hint_2: P.hint2,
};

/** RN-22: o total nunca fica abaixo de 0. */
export function applyDelta(total: number, delta: number): number {
  return Math.max(P.minTotal, total + delta);
}

export type HintTier = 0 | 1 | 2;

/** Próxima dica que dá para comprar: a Dica 2 só depois da Dica 1 (RN-29). */
export function nextHint(used: HintTier): 1 | 2 | null {
  return used === 0 ? 1 : used === 1 ? 2 : null;
}

/** Custo da dica (0 quando é grátis: vantagem do Cofre, Plano B/Bússola, entrega da Narradora). */
export function hintCost(tier: 1 | 2, free: boolean): number {
  if (free) return 0;
  return tier === 1 ? P.hint1 : P.hint2;
}

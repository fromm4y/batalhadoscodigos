/**
 * Pontuação da temporada (SPEC 7.6) e dicas (RN-29). Valores em GAME_RULES.
 */
import { GAME_RULES } from '@/config/gameRules';
import type { Level, LedgerReason } from '@/types/domain';

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
  vault_fast: P.vaultFast,
  bonus_mission: P.bonusMission,
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

/**
 * Custo da dica (0 quando é grátis: vantagem do Cofre, Plano B/Bússola, entrega da Narradora).
 * Nos níveis B e C a dica custa mais (pedido da May, 16/11).
 */
export function hintCost(tier: 1 | 2, free: boolean, level: Level = 'A'): number {
  if (free) return 0;
  const c = P.hintsByLevel[level];
  return tier === 1 ? c.hint1 : c.hint2;
}

/**
 * Combo (16/11): abriu de primeira, sem nenhum erro e sem nenhuma dica nesse desafio?
 * Habilidade de dica grátis (Plano B/Bússola) também conta como dica.
 */
export function isCombo(hintsUsed: number | undefined, misses: number | undefined): boolean {
  return !hintsUsed && !misses;
}

/** Força do puxão ao abrir um cadeado, com o bônus de combo. */
export function lockPull(combo: boolean): number {
  return GAME_RULES.pull.lockOpen + (combo ? GAME_RULES.pull.comboBonus : 0);
}

/**
 * Cofre Relâmpago (16/11): resolveu o Cofre até `vaultLightningMinutes` depois de a Narradora
 * liberar? `phaseStartMs` e `nowMs` no relógio do servidor (o tempo congelado já foi descontado).
 */
export function isLightningVault(level: Level, phaseStartMs: number, nowMs: number): boolean {
  return nowMs - phaseStartMs <= GAME_RULES.vaultLightningMinutes[level] * 60_000;
}

/** Segundos que ainda faltam para o Cofre Relâmpago (0 = acabou). */
export function lightningSecondsLeft(level: Level, phaseStartMs: number, nowMs: number): number {
  const end = phaseStartMs + GAME_RULES.vaultLightningMinutes[level] * 60_000;
  return Math.max(0, Math.ceil((end - nowMs) / 1000));
}

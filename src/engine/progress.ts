/**
 * Onde a dupla está no episódio, de acordo com a fase da sessão (RN-05, RN-09, RN-27).
 */
import type { Episode, NarratorScript, ResolvedChallenge } from '@/content/types';
import type { Level, Phase, PlayerDoc, Side } from '@/types/domain';
import type { Slot } from './challenges';

export type Stage =
  /** `step`: etapa 0 ou 1 do desafio (17/11) */
  | { kind: 'challenge'; slot: Slot; step: 0 | 1 }
  /** terminou o que a fase permite: espera a Narradora (RN-10) */
  | { kind: 'waiting' }
  | { kind: 'none' };

export function currentStage(phase: Phase, progress: PlayerDoc['progress']): Stage {
  if (phase === 'locks') {
    return progress.lockIndex < 3
      ? { kind: 'challenge', slot: progress.lockIndex as 0 | 1 | 2, step: progress.step ?? 0 }
      : { kind: 'waiting' };
  }
  if (phase === 'vault') {
    // RN-09: todo mundo vai para o Cofre, mesmo sem os 3 cadeados.
    return progress.vaultSolvedAt
      ? { kind: 'waiting' }
      : { kind: 'challenge', slot: 'vault', step: progress.vaultStep ?? 0 };
  }
  return { kind: 'none' };
}

/** Texto que a Narradora fala para este desafio, no nível da turma (RN-45). */
export function spokenClueFor(
  script: NarratorScript,
  level: Level,
  challengeKey: string,
): string | null {
  return script.spokenClues[level].find((c) => c.challengeKey === challengeKey)?.say ?? null;
}

/**
 * O desafio depende da transmissão da Narradora? Cartões com coluna "rasgada/molhada" (Ep. 1) e
 * cifra com a chave falada (Ep. 2),
 * entrada do painel (Ep. 3) quantidade de tarefas do console (Ep. 4) e jogada da máquina (Ep. 5).
 */
export function needsTransmission(ch: ResolvedChallenge): boolean {
  switch (ch.type) {
    case 'punchCardRead':
    case 'punchCardWrite':
      // etapa 2 sem coluna falada: spokenColumn = -1
      return ch.variant.spokenColumn >= 0;
    case 'cipher':
      return ch.variant.spokenKey === true;
    case 'wiring':
      return ch.variant.startSpoken === true;
    case 'priority':
      return ch.variant.mode === 'select' && ch.variant.pickSpoken === true;
    case 'boardChoice':
      // etapa 2: a jogada da máquina já aparece
      return ch.variant.revealed !== true;
    default:
      return false;
  }
}

/** Chave do desafio para dicas: `red-lock1`, `blue-vault`... (etapa 2: a `key` do `stage2`) */
export function challengeKey(ep: Episode, side: Side, slot: Slot, step: 0 | 1 = 0): string {
  const c = slot === 'vault' ? ep.sides[side].vault : ep.sides[side].locks[slot];
  return step === 1 && c.stage2 ? c.stage2.key : c.key;
}

/**
 * Onde a dupla está no episódio, de acordo com a fase da sessão (RN-05, RN-09, RN-27).
 */
import type { Episode, NarratorScript, ResolvedChallenge } from '@/content/types';
import type { Level, Phase, PlayerDoc, Side } from '@/types/domain';
import type { Slot } from './challenges';

export type Stage =
  | { kind: 'challenge'; slot: Slot }
  /** terminou o que a fase permite: espera a Narradora (RN-10) */
  | { kind: 'waiting' }
  | { kind: 'none' };

export function currentStage(phase: Phase, progress: PlayerDoc['progress']): Stage {
  if (phase === 'locks') {
    return progress.lockIndex < 3
      ? { kind: 'challenge', slot: progress.lockIndex as 0 | 1 | 2 }
      : { kind: 'waiting' };
  }
  if (phase === 'vault') {
    // RN-09: todo mundo vai para o Cofre, mesmo sem os 3 cadeados.
    return progress.vaultSolvedAt ? { kind: 'waiting' } : { kind: 'challenge', slot: 'vault' };
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

/** O desafio depende da transmissão da Narradora? (cartões com coluna "rasgada/molhada") */
export function needsTransmission(ch: ResolvedChallenge): boolean {
  return ch.type === 'punchCardRead' || ch.type === 'punchCardWrite';
}

/** Chave do desafio para dicas: `red-lock1`, `blue-vault`... */
export function challengeKey(ep: Episode, side: Side, slot: Slot): string {
  return slot === 'vault' ? ep.sides[side].vault.key : ep.sides[side].locks[slot].key;
}

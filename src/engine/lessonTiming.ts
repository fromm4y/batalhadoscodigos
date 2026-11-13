/**
 * Orçamento de tempo da aula (Etapa 8): tempos guia das fases + entrada das duplas,
 * e o pior caso do robô dentro de cada fase. Funções puras, testadas.
 */
import { GAME_RULES } from '@/config/gameRules';
import type { Level } from '@/types/domain';

export function lessonGuideMinutes(rules = GAME_RULES): number {
  const g = rules.phaseGuideMinutes;
  return rules.lesson.entryMinutes + g.lobby + g.planning + g.locks + g.vault + g.end;
}

/**
 * Pior caso do robô (s): os 3 cadeados no tempo máximo + uma Interferência por cadeado
 * e o evento do museu (que pausa o robô enquanto dura).
 */
export function machineWorstCaseSeconds(level: Level, eventSeconds: number, rules = GAME_RULES) {
  const t = rules.machineSolveSeconds[level];
  const freeze = rules.abilities.interferenceFreezeSeconds;
  return {
    locks: 3 * (t.lock[1] + freeze) + eventSeconds,
    vault: t.vault[1] + freeze,
  };
}

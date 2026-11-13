/**
 * Evento do museu (SPEC 7.8): Alarme Falso. Funções puras sobre o tempo do servidor.
 */
import { GAME_RULES } from '@/config/gameRules';
import type { MuseumEvent } from '@/content/types';

/** RN-32: momento sorteado para o disparo automático, entre 8 e 12 min após o início de `locks`. */
export function pickAutoEventAt(locksStartMs: number, rand: () => number = Math.random): number {
  const { autoTriggerMinMinutes: min, autoTriggerMaxMinutes: max } = GAME_RULES.museumEvent;
  return locksStartMs + Math.round((min + rand() * (max - min)) * 60_000);
}

export const eventDurationMs = (ev: MuseumEvent) => ev.items.length * ev.secondsPerItem * 1000;

/** Qual alerta está na tela agora (−1 = acabou). */
export function currentItem(ev: MuseumEvent, startedAtMs: number, nowMs: number): number {
  const i = Math.floor((nowMs - startedAtMs) / (ev.secondsPerItem * 1000));
  return i >= 0 && i < ev.items.length ? i : -1;
}

export function secondsLeftInItem(ev: MuseumEvent, startedAtMs: number, nowMs: number): number {
  const per = ev.secondsPerItem * 1000;
  const elapsed = nowMs - startedAtMs;
  return Math.max(0, Math.ceil((per - (elapsed % per)) / 1000));
}

/** RN-34/35: acertou os 3? Resposta ausente (tempo esgotado) conta como erro. */
export function eventSucceeded(ev: MuseumEvent, answers: (boolean | null)[]): boolean {
  return ev.items.every((it, i) => answers[i] === it.isReal);
}

/** Fim da prisão: 60 s depois do fim do evento (RN-35). */
export function jailUntilMs(startedAtMs: number, ev: MuseumEvent): number {
  return startedAtMs + eventDurationMs(ev) + GAME_RULES.museumEvent.jailSeconds * 1000;
}

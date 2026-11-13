import { describe, expect, it } from 'vitest';
import type { Episode } from '@/content/types';
import ep1Json from '@/content/episodes/ep1.json';
import {
  currentItem,
  eventSucceeded,
  jailUntilMs,
  pickAutoEventAt,
  secondsLeftInItem,
} from './museumEvent';

const ev = (ep1Json as unknown as Episode).event;

describe('evento do museu (7.8)', () => {
  it('disparo automático entre 8 e 12 min após o início dos cadeados', () => {
    expect(pickAutoEventAt(0, () => 0)).toBe(8 * 60_000);
    expect(pickAutoEventAt(0, () => 1)).toBe(12 * 60_000);
  });
  it('3 alertas de 15 s em sequência', () => {
    expect(currentItem(ev, 0, 0)).toBe(0);
    expect(currentItem(ev, 0, 14_999)).toBe(0);
    expect(currentItem(ev, 0, 15_000)).toBe(1);
    expect(currentItem(ev, 0, 44_999)).toBe(2);
    expect(currentItem(ev, 0, 45_000)).toBe(-1);
    expect(secondsLeftInItem(ev, 0, 1_000)).toBe(14);
  });
  it('acertar os 3 = sucesso; errar ou deixar o tempo acabar = prisão', () => {
    const right = ev.items.map((i) => i.isReal);
    expect(eventSucceeded(ev, right)).toBe(true);
    expect(eventSucceeded(ev, [right[0]!, !right[1], right[2]!])).toBe(false);
    expect(eventSucceeded(ev, [right[0]!, right[1]!, null])).toBe(false);
  });
  it('prisão termina 60 s depois do fim do evento', () => {
    expect(jailUntilMs(1000, ev)).toBe(1000 + 45_000 + 60_000);
  });
});

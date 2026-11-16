import { describe, expect, it } from 'vitest';
import { GAME_RULES } from '@/config/gameRules';
import type { TeamCard } from '@/types/domain';
import {
  addCard,
  albumSlot,
  cardEffect,
  cardUsesLeft,
  cardsToGrant,
  equippableCards,
} from './cards';

const at = { toMillis: () => 1 } as unknown as TeamCard['earnedAt'];
const card = (episodeId: string, variant: TeamCard['variant'] = 'normal'): TeamCard => ({
  episodeId,
  variant,
  earnedAt: at,
});

describe('cartas do Álbum (16/11)', () => {
  it('quem jogou ganha; dourada só para quem venceu o confronto', () => {
    const g = cardsToGrant(
      [
        { teamId: 'a', side: 'red', matchId: 'm1' },
        { teamId: 'b', side: 'blue', matchId: 'm1' },
        { teamId: 'c', side: 'blue', matchId: 'm2' },
        { teamId: 'faltou', side: null, matchId: null },
      ],
      { m1: { winner: 'red' }, m2: { winner: 'draw' } },
    );
    expect(g).toEqual([
      { teamId: 'a', variant: 'dourada' },
      { teamId: 'b', variant: 'normal' },
      { teamId: 'c', variant: 'normal' },
    ]);
  });
  it('não duplica; normal vira dourada, dourada nunca volta a normal', () => {
    expect(addCard(undefined, 'ep1', 'normal', at)).toEqual([card('ep1')]);
    expect(addCard([card('ep1')], 'ep1', 'normal', at)).toBeNull();
    expect(addCard([card('ep1')], 'ep1', 'dourada', at)).toEqual([card('ep1', 'dourada')]);
    expect(addCard([card('ep1', 'dourada')], 'ep1', 'normal', at)).toBeNull();
  });
  it('só dá para equipar cartas de OUTROS episódios', () => {
    expect(equippableCards([card('ep1'), card('ep2')], 'ep2').map((c) => c.episodeId)).toEqual([
      'ep1',
    ]);
  });
  it('a dourada (rara) tem mais usos por episódio', () => {
    const U = GAME_RULES.cards.usesPerEpisode;
    expect(cardUsesLeft(card('ep1'), 0)).toBe(U.normal);
    expect(cardUsesLeft(card('ep1', 'dourada'), 0)).toBe(U.dourada);
    expect(cardUsesLeft(card('ep1'), U.normal)).toBe(0);
    expect(cardUsesLeft(undefined, 0)).toBe(0);
    expect(U.dourada).toBeGreaterThan(U.normal);
  });
  it('poderes: dicas na hora ou efeito guardado', () => {
    expect(cardEffect('freeHint')).toEqual({ kind: 'hints', tier: 1 });
    expect(cardEffect('freeHint2')).toEqual({ kind: 'hints', tier: 2 });
    expect(cardEffect('extraPull')).toEqual({ kind: 'boost', boost: 'extraPull' });
  });
  it('álbum: ganha, dourada, perdida (faltou) e futura', () => {
    const cards = [card('ep1', 'dourada'), card('ep2')];
    const played = ['ep1', 'ep2', 'ep3'];
    expect(albumSlot('ep1', cards, played)).toBe('dourada');
    expect(albumSlot('ep2', cards, played)).toBe('ganha');
    expect(albumSlot('ep3', cards, played)).toBe('perdida');
    expect(albumSlot('ep4', cards, played)).toBe('futura');
  });
});

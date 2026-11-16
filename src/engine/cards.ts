/**
 * Cartas do Álbum do Museu (SPEC-02 C2 + pedido da May, 16/11). Funções puras.
 * - Concessão: toda dupla que jogou o episódio ganha a carta; dourada se venceu o confronto.
 * - Inventário: a carta de um episódio pode ser equipada nos OUTROS episódios.
 */
import { GAME_RULES } from '@/config/gameRules';
import type { CardPowerId } from '@/content/types';
import type { CardBoost, CardVariant, MatchDoc, PlayerDoc, TeamCard } from '@/types/domain';

type P = Pick<PlayerDoc, 'teamId' | 'side' | 'matchId'>;

/** Quem ganha carta no fim do episódio, e de qual tipo. */
export function cardsToGrant(
  players: P[],
  matches: Record<string, Pick<MatchDoc, 'winner'>>,
): { teamId: string; variant: CardVariant }[] {
  return players
    .filter((p) => !!p.side)
    .map((p) => {
      const m = p.matchId ? matches[p.matchId] : undefined;
      return { teamId: p.teamId, variant: m?.winner === p.side ? 'dourada' : 'normal' };
    });
}

/**
 * Coloca a carta no inventário. Já tinha a do episódio (jogou de novo)? Fica a melhor:
 * normal pode virar dourada, nunca o contrário. Devolve `null` quando nada muda.
 */
export function addCard(
  cards: TeamCard[] | undefined,
  episodeId: string,
  variant: CardVariant,
  earnedAt: TeamCard['earnedAt'],
): TeamCard[] | null {
  const list = cards ?? [];
  const had = list.find((c) => c.episodeId === episodeId);
  if (had && (had.variant === 'dourada' || variant === 'normal')) return null;
  return [...list.filter((c) => c.episodeId !== episodeId), { episodeId, variant, earnedAt }];
}

/** Cartas que podem ser equipadas neste episódio (as de outros episódios). */
export function equippableCards(cards: TeamCard[] | undefined, episodeId: string): TeamCard[] {
  return (cards ?? []).filter((c) => c.episodeId !== episodeId);
}

/** Quantos usos a carta equipada ainda tem neste episódio. */
export function cardUsesLeft(card: TeamCard | undefined, used: number | undefined): number {
  if (!card) return 0;
  return Math.max(0, GAME_RULES.cards.usesPerEpisode[card.variant] - (used ?? 0));
}

export type CardEffect =
  /** abre dicas na hora, no desafio atual */
  | { kind: 'hints'; tier: 1 | 2 }
  /** fica guardado até o momento certo */
  | { kind: 'boost'; boost: CardBoost };

export function cardEffect(power: CardPowerId): CardEffect {
  switch (power) {
    case 'freeHint':
      return { kind: 'hints', tier: 1 };
    case 'freeHint2':
      return { kind: 'hints', tier: 2 };
    case 'extraPull':
    case 'forgiveMiss':
    case 'lightningPlus':
      return { kind: 'boost', boost: power };
  }
}

/** Situação de cada episódio no álbum (SPEC-02 C2). */
export type AlbumSlot = 'ganha' | 'dourada' | 'perdida' | 'futura';
export function albumSlot(
  episodeId: string,
  cards: TeamCard[] | undefined,
  /** episódios que a turma já jogou (sessões abertas para ela) */
  playedByClass: string[],
): AlbumSlot {
  const c = (cards ?? []).find((x) => x.episodeId === episodeId);
  if (c) return c.variant === 'dourada' ? 'dourada' : 'ganha';
  return playedByClass.includes(episodeId) ? 'perdida' : 'futura';
}

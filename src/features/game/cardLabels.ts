import { GAME_RULES } from '@/config/gameRules';
import type { CardPowerId } from '@/content/types';
import type { TeamCard } from '@/types/domain';

const POWER_ICON: Record<CardPowerId, string> = {
  freeHint: '💡',
  freeHint2: '🧠',
  extraPull: '💪',
  forgiveMiss: '🛟',
  lightningPlus: '⏱️',
};
export const powerIcon = (id: CardPowerId) => POWER_ICON[id];

export const usesLabel = (c: TeamCard) => {
  const n = GAME_RULES.cards.usesPerEpisode[c.variant];
  return `${n} uso${n > 1 ? 's' : ''} neste episódio`;
};

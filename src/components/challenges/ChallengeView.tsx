import type { ResolvedChallenge } from '@/content/types';
import type { Level } from '@/types/domain';
import { AnagramChallenge } from './AnagramChallenge';
import { BlockBuildChallenge, BlockDebugChallenge } from './BlockChallenges';
import type { ChallengeBaseProps } from './common';
import { PunchCardReadChallenge, PunchCardWriteChallenge } from './PunchCardChallenges';
import { QuizChallenge } from './QuizChallenge';
import { RiddleChallenge } from './RiddleChallenge';

type Props = ChallengeBaseProps & {
  challenge: ResolvedChallenge;
  level: Level;
  /** semente do embaralhamento (id da dupla) */
  seed: string;
  /** a dupla já ouviu a transmissão da Narradora (cartões) */
  heardTransmission: boolean;
};

/** Escolhe o componente pelo tipo do desafio (o motor não conhece episódios: tudo vem do JSON). */
export function ChallengeView({ challenge, level, seed, heardTransmission, ...base }: Props) {
  switch (challenge.type) {
    case 'quiz':
      return <QuizChallenge variant={challenge.variant} {...base} />;
    case 'riddle':
      return <RiddleChallenge variant={challenge.variant} {...base} />;
    case 'anagram':
      return <AnagramChallenge variant={challenge.variant} seed={seed} {...base} />;
    case 'punchCardRead':
      return (
        <PunchCardReadChallenge variant={challenge.variant} heard={heardTransmission} {...base} />
      );
    case 'punchCardWrite':
      return (
        <PunchCardWriteChallenge variant={challenge.variant} heard={heardTransmission} {...base} />
      );
    case 'blockBuild':
      return <BlockBuildChallenge variant={challenge.variant} level={level} {...base} />;
    case 'blockDebug':
      return <BlockDebugChallenge variant={challenge.variant} {...base} />;
  }
}

import type { ResolvedChallenge } from '@/content/types';
import type { Level } from '@/types/domain';
import { AnagramChallenge } from './AnagramChallenge';
import { BlockBuildChallenge, BlockDebugChallenge } from './BlockChallenges';
import { BoardChoiceChallenge } from './BoardChoiceChallenge';
import { CipherChallenge } from './CipherChallenge';
import { GameTreeChallenge } from './GameTreeChallenge';
import { PriorityChallenge } from './PriorityChallenge';
import { WiringChallenge } from './WiringChallenge';
import type { ChallengeBaseProps } from './common';
import { PunchCardReadChallenge, PunchCardWriteChallenge } from './PunchCardChallenges';
import { QuizChallenge } from './QuizChallenge';
import { RiddleChallenge } from './RiddleChallenge';

type Props = ChallengeBaseProps & {
  challenge: ResolvedChallenge;
  level: Level;
  /** semente do embaralhamento (id da dupla) */
  seed: string;
  /** a dupla já ouviu a transmissão da Narradora (cartões, chave da cifra) */
  heardTransmission: boolean;
};

/** Escolhe o componente pelo tipo do desafio (o motor não conhece episódios: tudo vem do JSON). */
export function ChallengeView({ challenge, level, seed, heardTransmission, ...base }: Props) {
  switch (challenge.type) {
    case 'quiz':
      return (
        <QuizChallenge variant={challenge.variant} seed={`${seed}:${challenge.key}`} {...base} />
      );
    case 'riddle':
      return (
        <RiddleChallenge variant={challenge.variant} seed={`${seed}:${challenge.key}`} {...base} />
      );
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
    case 'cipher':
      return (
        <CipherChallenge
          variant={challenge.variant}
          heard={heardTransmission}
          seed={`${seed}:${challenge.key}`}
          {...base}
        />
      );
    case 'wiring':
      return (
        <WiringChallenge
          variant={challenge.variant}
          heard={heardTransmission}
          seed={`${seed}:${challenge.key}`}
          {...base}
        />
      );
    case 'priority':
      return (
        <PriorityChallenge
          variant={challenge.variant}
          heard={heardTransmission}
          seed={`${seed}:${challenge.key}`}
          {...base}
        />
      );
    case 'boardChoice':
      return (
        <BoardChoiceChallenge
          variant={challenge.variant}
          heard={heardTransmission}
          level={level}
          {...base}
        />
      );
    case 'gameTree':
      return (
        <GameTreeChallenge
          variant={challenge.variant}
          seed={`${seed}:${challenge.key}`}
          {...base}
        />
      );
  }
}

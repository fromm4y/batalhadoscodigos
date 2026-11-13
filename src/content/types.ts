/**
 * Formato de conteúdo dos episódios (SPEC 11). O motor só conhece estes tipos:
 * criar um episódio novo = adicionar um JSON que siga este formato.
 */
import type { Level } from '@/types/domain';

export type Speaker = 'professor' | 'capita' | 'narradora' | 'robo';

export type ComicPanelContent = {
  caption?: string;
  speech?: { who: Speaker; text: string };
  /** id de ilustração (src/assets/**) */
  art: string;
};

// ---------- Mini-linguagem de blocos (11.3) ----------
export type BlockSymbol = 'star' | 'dot' | 'line';
export type BlockNode =
  { type: 'weave'; symbol: BlockSymbol } | { type: 'repeat'; times: number; body: BlockNode[] };
export type Program = BlockNode[];
/** Peças disponíveis na paleta do BlockBuild. */
export type PaletteBlock = BlockSymbol | 'repeat';

// ---------- Variantes por tipo (11.2) ----------
type Base = { prompt: string; hint1: string; hint2: string };

export type QuizVariant = Base & {
  questions: { q: string; options: string[]; correct: number }[];
};
export type RiddleVariant = Base & {
  mode: 'choice' | 'text';
  text: string;
  options?: string[];
  /** respostas aceitas, já normalizadas */
  accept: string[];
};
export type AnagramVariant = Base & {
  answer: string;
  mode: 'perWordFirstFixed' | 'perWord' | 'whole';
};
export type PunchCardReadVariant = Base & {
  rows: number;
  columns: number[];
  decode: 'digits' | 'letters';
  answer: string;
  spokenColumn: number;
};
export type PunchCardWriteVariant = Base & {
  rows: number;
  target: number[];
  decode: 'digits' | 'letters';
  shownTarget: string;
  spokenColumn: number;
};
export type BlockBuildVariant = Base & {
  palette: PaletteBlock[];
  target: BlockSymbol[];
  maxBlocks: number;
};
export type BlockDebugVariant = Base & {
  program: Program;
  target: BlockSymbol[];
  editable: 'symbols' | 'counts' | 'both';
};

export type VariantByType = {
  quiz: QuizVariant;
  riddle: RiddleVariant;
  anagram: AnagramVariant;
  punchCardRead: PunchCardReadVariant;
  punchCardWrite: PunchCardWriteVariant;
  blockBuild: BlockBuildVariant;
  blockDebug: BlockDebugVariant;
};
export type ChallengeType = keyof VariantByType;

type ChallengeOf<T extends ChallengeType> = {
  key: string;
  title: string;
  leaderLine: string;
  type: T;
  variants: Record<Level, VariantByType[T]>;
  reward?: { clue: string };
};
export type Challenge = { [T in ChallengeType]: ChallengeOf<T> }[ChallengeType];

/** Uma variante já escolhida pelo nível, com o tipo junto (para o `switch` dos componentes). */
export type ResolvedChallenge = {
  [T in ChallengeType]: {
    key: string;
    title: string;
    leaderLine: string;
    type: T;
    variant: VariantByType[T];
    reward?: { clue: string };
  };
}[ChallengeType];

export type MuseumEvent = {
  type: 'alarmTrueFalse';
  title: string;
  secondsPerItem: number;
  items: { text: string; isReal: boolean; explanation: string }[];
};

export type NarratorScript = {
  opening: string;
  spokenClues: Record<Level, { challengeKey: string; say: string }[]>;
  revealLines: string[];
  closing: string;
};

export type SideContent = {
  name: string;
  locks: [Challenge, Challenge, Challenge];
  vault: Challenge;
};

export type Episode = {
  id: string;
  number: number;
  title: string;
  invention: { name: string; year: string; people: string[] };
  intro: { comic: ComicPanelContent[]; red: string; blue: string };
  dossier: string[];
  curiosities: string[];
  sides: { red: SideContent; blue: SideContent };
  event: MuseumEvent;
  narratorScript: NarratorScript;
  reveal: ComicPanelContent[];
  nextHook: string;
};

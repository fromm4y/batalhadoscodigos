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

/** Ep. 2 — cifra de deslocamento A–Z, sem acentos (SPEC-03 §1). */
export type CipherVariant = Base & {
  mode: 'decode' | 'encode' | 'crack' | 'verify';
  /** chave (1–25) */
  shift: number;
  /** preset: disco já girado e travado na chave; free: a dupla gira */
  wheel: 'preset' | 'free';
  /** decode/crack: texto cifrado · encode: texto original */
  text?: string;
  /** resposta esperada (não existe em verify) */
  answer?: string;
  /** verify: mensagens cifradas; a correta é options[correct] */
  options?: string[];
  correct?: number;
  /** crack nível C: palavra que sabemos estar no começo */
  crib?: string;
  /** a chave só chega pela transmissão (RN-45) */
  spokenKey?: boolean;
};

/** Ep. 3 — painel do ENIAC: módulos "+3", "x2", "-1" ligados em sequência (SPEC-03 §2). */
export type WiringVariant = Base & {
  mode: 'build' | 'debug';
  start: number;
  modules: string[];
  /** quantos módulos entram no circuito (pode sobrar módulo pegadinha) */
  slots: number;
  target: number;
  /** debug: ordem sabotada inicial */
  chain?: string[];
  /** a entrada só chega pela transmissão */
  startSpoken?: boolean;
};

/** Ep. 4 — console da Apollo: escolher tarefas (SPEC-03 §3). */
export type PriorityTask = { id: string; label: string; cost?: number; value?: number };
export type PriorityVariant = Base & {
  mode: 'select' | 'budget';
  tasks: PriorityTask[];
  pick?: number;
  pickSpoken?: boolean;
  correct?: string[];
  capacity?: number;
  capacityLabel?: string;
  valueLabel?: string;
  optimalValue?: number;
};

/** Ep. 5 — jogo da velha (SPEC-03 §4.2). Tabuleiro: 9 caracteres "X", "O" ou ".". */
export type BoardChoiceVariant = Base & {
  board: string;
  you: 'X';
  spokenMove: { cell: number; symbol: 'O' };
  answer: number;
};

/** Ep. 5 — árvore de jogadas / minimax (SPEC-03 §4.3). */
export type GameTreeVariant = Base & {
  depth: 2 | 3;
  tree: Record<string, number[] | Record<string, number[]>>;
  answer: string;
};

export type VariantByType = {
  quiz: QuizVariant;
  riddle: RiddleVariant;
  anagram: AnagramVariant;
  punchCardRead: PunchCardReadVariant;
  punchCardWrite: PunchCardWriteVariant;
  blockBuild: BlockBuildVariant;
  blockDebug: BlockDebugVariant;
  cipher: CipherVariant;
  wiring: WiringVariant;
  priority: PriorityVariant;
  boardChoice: BoardChoiceVariant;
  gameTree: GameTreeVariant;
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

/** Carta do Álbum do Museu (SPEC-02 Parte B/C). */
export type EpisodeCard = {
  title: string;
  year: string;
  people: string[];
  facts: string[];
  art: string;
};

type EpisodeBase = {
  id: string;
  number: number;
  title: string;
  invention: { name: string; year: string; people: string[] };
  dossier: string[];
  curiosities: string[];
  event: MuseumEvent;
  narratorScript: NarratorScript;
  reveal: ComicPanelContent[];
  /**
   * Gancho que APONTA PARA O EPISÓDIO SEGUINTE da ordem longa (ep N descreve o ep N+1).
   * A tela final escolhe o teaser pelo próximo episódio da temporada ativa (`teaserFor`).
   */
  teaser: { line: string; art: string };
  /** "Anteriormente na Caçada..." do episódio seguinte */
  recapOfThis: string[];
  card: EpisodeCard;
};

/** Episódio Bando × Piratas (Ep. 1 a 4). */
export type Episode = EpisodeBase & {
  mode?: 'versus';
  intro: { comic: ComicPanelContent[]; red: string; blue: string };
  sides: { red: SideContent; blue: SideContent };
};

/** Ep. 5 — a turma inteira contra a máquina (SPEC-03 §4). */
export type CoopEpisode = EpisodeBase & {
  mode: 'coop';
  intro: { comic: ComicPanelContent[]; coop: string };
  coop: { locks: [Challenge, Challenge, Challenge]; vault: Challenge };
};

export type AnyEpisode = Episode | CoopEpisode;

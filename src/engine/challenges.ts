/**
 * Verificadores dos 7 tipos de desafio (SPEC 11.2). Funções puras: recebem a variante e a tentativa.
 */
import type {
  AnagramVariant,
  BlockBuildVariant,
  BlockDebugVariant,
  Episode,
  Program,
  PunchCardReadVariant,
  PunchCardWriteVariant,
  QuizVariant,
  ResolvedChallenge,
  RiddleVariant,
} from '@/content/types';
import type { Level, Side } from '@/types/domain';
import { matchesAccepted, normalizeAnswer } from './answers';
import { countNodes, nestingDepth, respectsDebugEdits, run, sameSymbols } from './blocks';

/** Desafio da etapa atual: cadeado 0–2 ou o Cofre ('vault'). */
export type Slot = 0 | 1 | 2 | 'vault';

export function resolveChallenge(
  ep: Episode,
  side: Side,
  level: Level,
  slot: Slot,
): ResolvedChallenge {
  const c = slot === 'vault' ? ep.sides[side].vault : ep.sides[side].locks[slot];
  return {
    key: c.key,
    title: c.title,
    leaderLine: c.leaderLine,
    type: c.type,
    variant: c.variants[level],
    reward: c.reward,
  } as ResolvedChallenge;
}

// ---------- quiz ----------
export const checkQuiz = (v: QuizVariant, question: number, option: number) =>
  v.questions[question]?.correct === option;

// ---------- riddle ----------
export function checkRiddle(v: RiddleVariant, answer: string): boolean {
  return matchesAccepted(answer, v.accept);
}

// ---------- anagram ----------
/** Letras da resposta por palavra (sem espaços), mantendo acentos para exibir. */
export function anagramWords(v: AnagramVariant): string[][] {
  return v.answer.split(/\s+/).map((w) => [...w]);
}
export function checkAnagram(v: AnagramVariant, words: string[][]): boolean {
  return normalizeAnswer(words.map((w) => w.join('')).join(' ')) === normalizeAnswer(v.answer);
}

// ---------- cartões perfurados ----------
/** Decodifica as linhas furadas: dígitos (8 → "8") ou letras (1=A, 2=B...). */
export function decodeColumns(rows: number[], decode: 'digits' | 'letters'): string {
  return rows.map((r) => (decode === 'digits' ? String(r) : String.fromCharCode(64 + r))).join('');
}
export function checkPunchRead(v: PunchCardReadVariant, answer: string): boolean {
  return (
    normalizeAnswer(answer).replace(/\s/g, '') === normalizeAnswer(v.answer).replace(/\s/g, '')
  );
}
/** `holes[i]` = linha furada na coluna i (ou null). Um furo por coluna. */
export function checkPunchWrite(v: PunchCardWriteVariant, holes: (number | null)[]): boolean {
  return holes.length === v.target.length && v.target.every((t, i) => holes[i] === t);
}

// ---------- blocos ----------
export type BlockCheck = {
  ok: boolean;
  reason?: 'too_many' | 'too_deep' | 'wrong_pattern' | 'illegal_edit';
};

export function checkBlockBuild(v: BlockBuildVariant, program: Program, level: Level): BlockCheck {
  if (countNodes(program) > v.maxBlocks) return { ok: false, reason: 'too_many' };
  if (level !== 'C' && nestingDepth(program) > 1) return { ok: false, reason: 'too_deep' };
  return sameSymbols(run(program), v.target)
    ? { ok: true }
    : { ok: false, reason: 'wrong_pattern' };
}

export function checkBlockDebug(v: BlockDebugVariant, program: Program): BlockCheck {
  if (!respectsDebugEdits(v.program, program, v.editable))
    return { ok: false, reason: 'illegal_edit' };
  return sameSymbols(run(program), v.target)
    ? { ok: true }
    : { ok: false, reason: 'wrong_pattern' };
}

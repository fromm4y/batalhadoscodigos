/**
 * Verificadores dos 7 tipos de desafio (SPEC 11.2). Funções puras: recebem a variante e a tentativa.
 */
import type {
  AnagramVariant,
  BlockBuildVariant,
  BlockDebugVariant,
  CipherVariant,
  Episode,
  WiringVariant,
  Program,
  PunchCardReadVariant,
  PunchCardWriteVariant,
  QuizVariant,
  ResolvedChallenge,
  RiddleVariant,
} from '@/content/types';
import type { Level, Side } from '@/types/domain';
import { matchesAccepted, normalizeAnswer } from './answers';
import { runChain } from './wiring';
import { countNodes, nestingDepth, respectsDebugEdits, run, sameSymbols } from './blocks';

/** Desafio da etapa atual: cadeado 0–2 ou o Cofre ('vault'). */
export type Slot = 0 | 1 | 2 | 'vault';

/** O desafio deste espaço tem etapa 2? (17/11) */
export function hasStage2(ep: Episode, side: Side, slot: Slot): boolean {
  const c = slot === 'vault' ? ep.sides[side].vault : ep.sides[side].locks[slot];
  return !!c.stage2;
}

/** Todas as chaves do desafio (etapa 1 e, se houver, etapa 2): combo e dicas. */
export function stageKeys(ep: Episode, side: Side, slot: Slot): string[] {
  const c = slot === 'vault' ? ep.sides[side].vault : ep.sides[side].locks[slot];
  return c.stage2 ? [c.key, c.stage2.key] : [c.key];
}

export function resolveChallenge(
  ep: Episode,
  side: Side,
  level: Level,
  slot: Slot,
  step: 0 | 1 = 0,
): ResolvedChallenge {
  const base = slot === 'vault' ? ep.sides[side].vault : ep.sides[side].locks[slot];
  const c = step === 1 && base.stage2 ? base.stage2 : base;
  return {
    key: c.key,
    title: c.title,
    leaderLine: c.leaderLine,
    type: c.type,
    variant: c.variants[level],
    reward: c.reward,
  } as ResolvedChallenge;
}

/** Missão bônus do lado (16/11), se o episódio tiver. */
export function resolveBonus(ep: Episode, side: Side, level: Level): ResolvedChallenge | null {
  const c = ep.sides[side].bonus;
  if (!c) return null;
  return {
    key: c.key,
    title: c.title,
    leaderLine: c.leaderLine,
    type: c.type,
    variant: c.variants[level],
  } as ResolvedChallenge;
}

// ---------- cipher (Ep. 2) ----------
/** decode/encode/crack: compara a mensagem digitada com a resposta (RN-28: sem acento, caixa e espaços extras). */
export function checkCipher(v: CipherVariant, typed: string): boolean {
  if (v.answer === undefined) return false;
  const n = normalizeAnswer(typed);
  return n.length > 0 && n === normalizeAnswer(v.answer);
}
/** verify: a opção escolhida (índice ORIGINAL, antes de embaralhar) é a mensagem certa? */
export const checkCipherVerify = (v: CipherVariant, option: number) => v.correct === option;

// ---------- wiring (Ep. 3) ----------
/**
 * Painel do ENIAC: os encaixes estão todos preenchidos, só com peças que existem no painel
 * (cada peça uma vez) e a conta chega no alvo. Com entrada falada, a dupla precisa ter
 * digitado o número certo na tomada.
 */
export function checkWiring(v: WiringVariant, chain: readonly string[], start: number): boolean {
  if (chain.length !== v.slots || start !== v.start) return false;
  const left = [...v.modules];
  for (const m of chain) {
    const i = left.indexOf(m);
    if (i < 0) return false;
    left.splice(i, 1);
  }
  return runChain(start, chain) === v.target;
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

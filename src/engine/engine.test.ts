import { describe, expect, it } from 'vitest';
import type { Episode, Program } from '@/content/types';
import ep1Json from '@/content/episodes/ep1.json';
import { GAME_RULES } from '@/config/gameRules';
import type { Level } from '@/types/domain';
import { matchesAccepted, normalizeAnswer } from './answers';
import { countNodes, nestingDepth, respectsDebugEdits, run } from './blocks';
import { buildAnagram } from './anagram';
import {
  checkAnagram,
  checkBlockBuild,
  checkBlockDebug,
  checkPunchRead,
  checkPunchWrite,
  checkQuiz,
  checkRiddle,
  decodeColumns,
  resolveChallenge,
} from './challenges';
import { currentStage } from './progress';
import { applyDelta, hintCost, nextHint, POINTS } from './scoring';

const ep1 = ep1Json as unknown as Episode;
const LEVELS: Level[] = ['A', 'B', 'C'];
const w = (symbol: 'star' | 'dot' | 'line') => ({ type: 'weave' as const, symbol });
const rep = (times: number, body: Program) => ({ type: 'repeat' as const, times, body });

describe('normalizeAnswer (RN-28)', () => {
  it('tira acentos, maiúsculas, pontuação e espaços duplicados', () => {
    expect(normalizeAnswer('  Cartão   PERFURADO!! ')).toBe('cartao perfurado');
    expect(normalizeAnswer('Ada, Lovelace.')).toBe('ada lovelace');
    expect(normalizeAnswer('São-Luís')).toBe('sao luis');
    expect(normalizeAnswer('ÂNCORA')).toBe('ancora');
  });
  it('aceita qualquer variante listada', () => {
    expect(matchesAccepted('O Cartão Perfurado', ['cartao perfurado', 'o cartao perfurado'])).toBe(
      true,
    );
    expect(matchesAccepted('cartões perfurados', ['cartoes perfurados'])).toBe(true);
    expect(matchesAccepted('', ['x'])).toBe(false);
    expect(matchesAccepted('teclado', ['cartao perfurado'])).toBe(false);
  });
});

describe('executor de blocos (11.3)', () => {
  it('executa sequência e repetições simples', () => {
    expect(run([w('star'), w('dot')])).toEqual(['star', 'dot']);
    expect(run([rep(3, [w('star'), w('dot')])])).toEqual([
      'star',
      'dot',
      'star',
      'dot',
      'star',
      'dot',
    ]);
  });
  it('executa repetições aninhadas', () => {
    const p = [rep(2, [rep(2, [w('star')]), w('line')])];
    expect(run(p)).toEqual(['star', 'star', 'line', 'star', 'star', 'line']);
    expect(nestingDepth(p)).toBe(2);
  });
  it('conta todos os nós, inclusive repeat (maxBlocks)', () => {
    expect(countNodes([rep(3, [w('star'), w('dot')])])).toBe(3);
    expect(countNodes([rep(3, [rep(2, [w('star'), w('dot')]), w('line')])])).toBe(5);
    expect(countNodes([])).toBe(0);
  });
  it('não trava com repetições gigantes', () => {
    expect(run([rep(1_000_000, [w('star')])]).length).toBeLessThanOrEqual(200);
  });
  it('blockDebug só aceita trocar o permitido (sem adicionar nem remover blocos)', () => {
    const orig = [rep(3, [w('star'), w('star')])];
    expect(respectsDebugEdits(orig, [rep(3, [w('star'), w('dot')])], 'symbols')).toBe(true);
    expect(respectsDebugEdits(orig, [rep(4, [w('star'), w('star')])], 'symbols')).toBe(false);
    expect(respectsDebugEdits(orig, [rep(4, [w('star'), w('star')])], 'counts')).toBe(true);
    expect(respectsDebugEdits(orig, [rep(3, [w('star'), w('dot')])], 'counts')).toBe(false);
    expect(respectsDebugEdits(orig, [rep(3, [w('star')])], 'both')).toBe(false);
  });
});

describe('pontuação (7.6)', () => {
  it('usa os valores de gameRules', () => {
    expect(POINTS.wrong_answer).toBe(GAME_RULES.points.wrongAnswer);
    expect(POINTS.hint_1).toBe(-2);
    expect(POINTS.hint_2).toBe(-4);
  });
  it('total nunca fica abaixo de 0 (RN-22)', () => {
    expect(applyDelta(1, -4)).toBe(0);
    expect(applyDelta(0, -2)).toBe(0);
    expect(applyDelta(5, 3)).toBe(8);
  });
  it('Dica 2 só depois da Dica 1; dica grátis custa 0 (RN-29)', () => {
    expect(nextHint(0)).toBe(1);
    expect(nextHint(1)).toBe(2);
    expect(nextHint(2)).toBeNull();
    expect(hintCost(1, false)).toBe(-2);
    expect(hintCost(2, false)).toBe(-4);
    expect(hintCost(1, true)).toBe(0);
  });
});

describe('progresso por fase (RN-05, RN-09)', () => {
  const base = {
    lockIndex: 0 as 0 | 1 | 2 | 3,
    locksOpenedAt: [null, null, null],
    vaultSolvedAt: null,
    eventResult: 'pending' as const,
    jailUntil: null,
    heardTransmission: false,
  };
  it('cadeados em sequência; depois do 3º, espera a Narradora', () => {
    expect(currentStage('locks', base)).toEqual({ kind: 'challenge', slot: 0 });
    expect(currentStage('locks', { ...base, lockIndex: 2 })).toEqual({
      kind: 'challenge',
      slot: 2,
    });
    expect(currentStage('locks', { ...base, lockIndex: 3 })).toEqual({ kind: 'waiting' });
  });
  it('no Cofre todo mundo joga, mesmo sem abrir os cadeados', () => {
    expect(currentStage('vault', base)).toEqual({ kind: 'challenge', slot: 'vault' });
  });
  it('lobby e planning não têm desafio', () => {
    expect(currentStage('lobby', base).kind).toBe('none');
    expect(currentStage('planning', base).kind).toBe('none');
  });
});

describe('anagrama', () => {
  it('embaralha com semente fixa e respeita o modo', () => {
    const v = resolveChallenge(ep1, 'blue', 'A', 1);
    if (v.type !== 'anagram') throw new Error('tipo');
    const a = buildAnagram(v.variant, 'dupla-1');
    const b = buildAnagram(v.variant, 'dupla-1');
    expect(a).toEqual(b);
    expect(a.words).toEqual([6, 9]);
    expect(Object.values(a.fixed)).toEqual(['C', 'P']);
    expect(a.tray.length).toBe(13);
    expect(a.tray.every((t) => t.word === 0 || t.word === 1)).toBe(true);
  });
});

/**
 * Conteúdo do Ep. 1: para cada lado e nível, a solução "oficial" (dicas e respostas do JSON)
 * precisa passar, e uma tentativa errada precisa falhar. Pega erro de digitação no conteúdo.
 */
describe('conteúdo do Ep. 1 é resolvível nos 3 níveis, dos dois lados', () => {
  const sides = ['red', 'blue'] as const;
  for (const side of sides) {
    for (const level of LEVELS) {
      it(`${side} nível ${level}`, () => {
        for (const slot of [0, 1, 2, 'vault'] as const) {
          const ch = resolveChallenge(ep1, side, level, slot);
          switch (ch.type) {
            case 'quiz':
              ch.variant.questions.forEach((q, i) => {
                expect(checkQuiz(ch.variant, i, q.correct)).toBe(true);
                expect(checkQuiz(ch.variant, i, (q.correct + 1) % q.options.length)).toBe(false);
              });
              break;
            case 'riddle':
              if (ch.variant.mode === 'choice') {
                const ok = ch.variant.options!.filter((o) => checkRiddle(ch.variant, o));
                expect(ok.length).toBe(1);
              }
              expect(checkRiddle(ch.variant, ch.variant.accept[0]!)).toBe(true);
              expect(checkRiddle(ch.variant, 'resposta errada')).toBe(false);
              break;
            case 'anagram': {
              const words = ch.variant.answer.split(' ').map((x) => [...x]);
              expect(checkAnagram(ch.variant, words)).toBe(true);
              expect(
                checkAnagram(
                  ch.variant,
                  words.map((x) => [...x].reverse()),
                ),
              ).toBe(false);
              break;
            }
            case 'punchCardRead':
              expect(decodeColumns(ch.variant.columns, ch.variant.decode)).toBe(ch.variant.answer);
              expect(checkPunchRead(ch.variant, ch.variant.answer.toLowerCase())).toBe(true);
              expect(ch.variant.spokenColumn).toBeLessThan(ch.variant.columns.length);
              expect(ch.variant.columns.every((r) => r >= 0 && r < ch.variant.rows)).toBe(true);
              break;
            case 'punchCardWrite':
              expect(checkPunchWrite(ch.variant, ch.variant.target)).toBe(true);
              expect(
                checkPunchWrite(
                  ch.variant,
                  ch.variant.target.map(() => null),
                ),
              ).toBe(false);
              break;
            case 'blockBuild': {
              const sol: Record<Level, Program> = {
                A: [rep(3, [w('star'), w('dot')])],
                B: [rep(4, [w('star'), w('star'), w('dot')])],
                C: [rep(3, [rep(2, [w('star'), w('dot')]), w('line')])],
              };
              expect(checkBlockBuild(ch.variant, sol[level], level).ok).toBe(true);
              // sem repetição estoura o limite de blocos
              const flat = ch.variant.target.map((s) => w(s));
              expect(checkBlockBuild(ch.variant, flat, level).reason).toBe('too_many');
              break;
            }
            case 'blockDebug': {
              // o programa original (com erro) NÃO gera o alvo
              expect(checkBlockDebug(ch.variant, ch.variant.program).ok).toBe(false);
              const fixed: Record<Level, Program> = {
                A: [rep(3, [w('star'), w('dot')])],
                B: [rep(4, [w('star'), w('star'), w('dot')])],
                C: [rep(3, [rep(2, [w('star'), w('dot')]), w('line')])],
              };
              expect(checkBlockDebug(ch.variant, fixed[level]).ok).toBe(true);
              break;
            }
          }
        }
      });
    }
  }

  it('as pistas faladas da Narradora existem para os cartões dos 3 níveis', () => {
    for (const level of LEVELS) {
      const keys = ep1.narratorScript.spokenClues[level].map((c) => c.challengeKey);
      expect(keys).toEqual(['red-lock3', 'blue-lock3']);
    }
  });
});

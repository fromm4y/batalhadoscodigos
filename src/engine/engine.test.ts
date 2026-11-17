import { describe, expect, it } from 'vitest';
import type { Episode, Program, PunchCardReadVariant } from '@/content/types';
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
  hasStage2,
  resolveChallenge,
  type Slot,
} from './challenges';
import { currentStage } from './progress';
import {
  applyDelta,
  hintCost,
  isCombo,
  isLightningVault,
  lightningSecondsLeft,
  lockPull,
  nextHint,
  POINTS,
} from './scoring';

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
    // 16/11: dica mais cara no B e no C
    // 17/11: o B voltou ao preço normal ("mediano"); só o C paga mais
    expect(hintCost(1, false, 'B')).toBe(-2);
    expect(hintCost(1, false, 'C')).toBe(-3);
    expect(hintCost(2, false, 'C')).toBe(-5);
    expect(hintCost(2, true, 'C')).toBe(0);
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
    expect(currentStage('locks', base)).toEqual({ kind: 'challenge', slot: 0, step: 0 });
    expect(currentStage('locks', { ...base, lockIndex: 2 })).toEqual({
      kind: 'challenge',
      slot: 2,
      step: 0,
    });
    // 17/11: etapa 2 do mesmo cadeado
    expect(currentStage('locks', { ...base, lockIndex: 1, step: 1 })).toEqual({
      kind: 'challenge',
      slot: 1,
      step: 1,
    });
    expect(currentStage('locks', { ...base, lockIndex: 3 })).toEqual({ kind: 'waiting' });
  });
  it('no Cofre todo mundo joga, mesmo sem abrir os cadeados', () => {
    expect(currentStage('vault', base)).toEqual({ kind: 'challenge', slot: 'vault', step: 0 });
    // a etapa do cadeado não vaza para o Cofre (RN-09: dá para chegar ao Cofre no meio)
    expect(currentStage('vault', { ...base, step: 1 })).toEqual({
      kind: 'challenge',
      slot: 'vault',
      step: 0,
    });
    expect(currentStage('vault', { ...base, vaultStep: 1 })).toEqual({
      kind: 'challenge',
      slot: 'vault',
      step: 1,
    });
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
    // CHARLES BABBAGE (Piratas reescrito em 15/11 para não repetir a resposta do Bando)
    expect(a.words).toEqual([7, 7]);
    expect(Object.values(a.fixed)).toEqual(['C', 'B']);
    expect(a.tray.length).toBe(12);
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
        for (const [slot, step] of [0, 1, 2, 'vault'].flatMap((x) =>
          [0, 1].map((st) => [x, st] as const),
        ) as [Slot, 0 | 1][]) {
          const ch = resolveChallenge(ep1, side, level, slot, step);
          // 17/11: todo desafio do Ep. 1 tem etapa 2, com key própria
          expect(hasStage2(ep1, side, slot)).toBe(true);
          if (step === 1) expect(ch.key).toMatch(/-2$/);
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
              // etapa 2: cartão maior que o da etapa 1 e sem coluna falada
              if (step === 1) {
                expect(ch.variant.spokenColumn).toBe(-1);
                expect(ch.variant.columns.length).toBeGreaterThan(
                  (resolveChallenge(ep1, side, level, slot, 0).variant as PunchCardReadVariant)
                    .columns.length,
                );
              }
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
              const sol: Record<Level, Program> =
                step === 0
                  ? {
                      A: [rep(3, [w('star'), w('dot')])],
                      B: [rep(4, [w('star'), w('star'), w('dot')])],
                      C: [rep(3, [rep(2, [w('star'), w('dot')]), w('line')])],
                    }
                  : {
                      A: [rep(3, [w('star'), w('star'), w('dot')])],
                      B: [rep(3, [w('star'), w('dot'), w('line')])],
                      C: [rep(2, [rep(3, [w('star')]), w('dot'), rep(2, [w('line')])])],
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
              // Piratas com padrões próprios (15/11): nenhuma resposta igual à do Bando.
              const fixed: Record<Level, Program> =
                step === 0
                  ? {
                      A: [rep(3, [w('dot'), w('line')])],
                      B: [rep(5, [w('dot'), w('dot'), w('star')])],
                      C: [rep(2, [rep(3, [w('dot'), w('star')]), w('line')])],
                    }
                  : {
                      A: [rep(3, [w('star'), w('line'), w('dot')])],
                      B: [rep(4, [w('star'), w('dot')]), rep(2, [w('line')])], // 1 contagem errada
                      C: [rep(3, [rep(3, [w('dot')]), w('star'), rep(2, [w('line')])])],
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

describe('alternativas embaralhadas por dupla (pedido da May, 15/11)', () => {
  it('é uma permutação, sempre igual para a mesma dupla', async () => {
    const { optionOrder } = await import('./shuffle');
    const a = optionOrder(3, 'dupla-1:red-lock1:0');
    expect([...a].sort()).toEqual([0, 1, 2]);
    expect(optionOrder(3, 'dupla-1:red-lock1:0')).toEqual(a);
  });
  it('em várias duplas, a resposta certa (índice 0) não fica sempre em primeiro', async () => {
    const { optionOrder } = await import('./shuffle');
    const firstPos = Array.from({ length: 30 }, (_, i) =>
      optionOrder(3, `dupla-${i}:q`).indexOf(0),
    );
    expect(new Set(firstPos).size).toBe(3);
  });
});

describe('gabarito do roteiro', () => {
  it('resume a resposta de todos os desafios de todos os episódios', async () => {
    const { answerKey } = await import('./answerKey');
    const eps = await Promise.all(
      ['ep1', 'ep2', 'ep3', 'ep4', 'ep5'].map((id) => import(`../content/episodes/${id}.json`)),
    );
    for (const { default: e } of eps) {
      const list = e.coop
        ? [...e.coop.locks, e.coop.vault]
        : [...e.sides.red.locks, e.sides.red.vault, ...e.sides.blue.locks, e.sides.blue.vault];
      for (const c of list)
        for (const lv of LEVELS)
          expect(answerKey(c, lv).length, `${e.id} ${c.key} ${lv}`).toBeGreaterThan(0);
    }
  });
});

describe('combo e Cofre Relâmpago (16/11)', () => {
  it('combo só sem erro e sem dica', () => {
    expect(isCombo(undefined, undefined)).toBe(true);
    expect(isCombo(0, 0)).toBe(true);
    expect(isCombo(1, 0)).toBe(false);
    expect(isCombo(0, 2)).toBe(false);
    expect(lockPull(true)).toBe(GAME_RULES.pull.lockOpen + GAME_RULES.pull.comboBonus);
    expect(lockPull(false)).toBe(GAME_RULES.pull.lockOpen);
  });
  it('relâmpago conta a partir da liberação do Cofre, por nível', () => {
    const min = GAME_RULES.vaultLightningMinutes;
    expect(isLightningVault('A', 0, min.A * 60_000)).toBe(true);
    expect(isLightningVault('A', 0, min.A * 60_000 + 1)).toBe(false);
    expect(isLightningVault('C', 1000, 1000 + min.C * 60_000 - 1)).toBe(true);
    expect(lightningSecondsLeft('B', 0, 0)).toBe(min.B * 60);
    expect(lightningSecondsLeft('B', 0, 10 * 60_000)).toBe(0);
  });
  it('o relâmpago é possível, mas mais curto que o tempo guia do Cofre', () => {
    for (const lv of ['A', 'B', 'C'] as const) {
      expect(GAME_RULES.vaultLightningMinutes[lv]).toBeLessThan(GAME_RULES.phaseGuideMinutes.vault);
      // a dupla tem chance de bater o robô mais lento
      expect(GAME_RULES.vaultLightningMinutes[lv] * 60).toBeGreaterThanOrEqual(
        GAME_RULES.machineSolveSeconds[lv].vault[0],
      );
    }
  });
});

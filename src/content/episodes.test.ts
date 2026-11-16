/**
 * Conteúdo dos episódios: formato válido e respostas conferidas (SPEC-03 §7).
 * Se algum destes testes falhar depois de mexer num JSON, o conteúdo ficou errado.
 */
import { describe, expect, it } from 'vitest';
import { bestMoves, forkMoves, placeMove, threats } from '@/engine/boardGames';
import { decodeText, shiftText } from '@/engine/cipher';
import { bestBudgetValue } from '@/engine/priority';
import { runChain, wiringSolutions } from '@/engine/wiring';
import { normalizeAnswer } from '@/engine/answers';
import ep1 from './episodes/ep1.json';
import ep2 from './episodes/ep2.json';
import ep3 from './episodes/ep3.json';
import ep4 from './episodes/ep4.json';
import ep5 from './episodes/ep5.json';
import { SEASON } from './season';
import type {
  Episode,
  RiddleVariant,
  AnyEpisode,
  BoardChoiceVariant,
  Challenge,
  CipherVariant,
  GameTreeVariant,
  PriorityVariant,
  WiringVariant,
} from './types';
import { validateEpisode } from './validateEpisode';

const ALL = { ep1, ep2, ep3, ep4, ep5 } as unknown as Record<string, AnyEpisode>;

function challengesOf(e: AnyEpisode): Challenge[] {
  if (e.mode === 'coop') return [...e.coop.locks, e.coop.vault];
  const opt = (c: Challenge | undefined) => (c ? [c] : []);
  const all = [
    ...e.sides.red.locks,
    e.sides.red.vault,
    ...opt(e.sides.red.bonus),
    ...e.sides.blue.locks,
    e.sides.blue.vault,
    ...opt(e.sides.blue.bonus),
  ];
  return [...all, ...all.flatMap((c) => opt(c.stage2))];
}
function variantsOf<V>(e: AnyEpisode, type: Challenge['type']): { tag: string; v: V }[] {
  return challengesOf(e)
    .filter((c) => c.type === type)
    .flatMap((c) =>
      (['A', 'B', 'C'] as const).map((lv) => ({
        tag: `${e.id} ${c.key} ${lv}`,
        v: c.variants[lv] as V,
      })),
    );
}

describe('formato dos episódios', () => {
  it.each(Object.keys(ALL))('%s valida contra os tipos', (id) => {
    expect(validateEpisode(ALL[id])).toEqual([]);
  });
  it('todo episódio da temporada tem JSON', () => {
    for (const s of SEASON) expect(ALL[s.id], s.id).toBeDefined();
  });
  it('o validador pega erros', () => {
    expect(validateEpisode({})).not.toEqual([]);
    const broken = structuredClone(ep2) as unknown as {
      sides: { red: { locks: { type: string }[] } };
    };
    broken.sides.red.locks[1]!.type = 'xadrez';
    expect(validateEpisode(broken).join()).toMatch(/tipo desconhecido/);
  });
});

describe('cipher (Ep. 2)', () => {
  const vs = Object.values(ALL).flatMap((e) => variantsOf<CipherVariant>(e, 'cipher'));
  it('decode/crack: shift(answer) = text · encode: shift(text) = answer', () => {
    expect(vs.length).toBeGreaterThan(0);
    for (const { tag, v } of vs) {
      if (v.mode === 'decode' || v.mode === 'crack')
        expect(shiftText(v.answer!, v.shift), tag).toBe(v.text);
      if (v.mode === 'encode') expect(shiftText(v.text!, v.shift), tag).toBe(v.answer);
      if (v.crib)
        expect(normalizeAnswer(v.answer!).startsWith(normalizeAnswer(v.crib)), tag).toBe(true);
    }
  });
  it('verify: só a opção correta vira palavras com a chave do dia', () => {
    // Dicionário do episódio: palavras de todos os textos do Ep. 2 + as mensagens certas.
    const words = new Set(
      normalizeAnswer(JSON.stringify(ep2))
        .toUpperCase()
        .split(/[^A-Z]+/)
        .filter(Boolean),
    );
    // Palavras curtas e as das mensagens certas, que no episódio só aparecem cifradas.
    const extra = 'O A E AO DA DO NA NO DE EM UM ESTA TESOURO SEGURO NAVIO PARTE MEIO DIA';
    for (const w of `${extra} GUARDEM MAQUINA SALA DOIS NOSSO SALVO CAPITA MANDOU RECUAR MUDOU ILHA`.split(
      ' ',
    ))
      words.add(w);
    for (const { tag, v } of vs.filter((x) => x.v.mode === 'verify')) {
      v.options!.forEach((opt, i) => {
        const plain = decodeText(opt, v.shift).split(' ');
        const real = plain.every((w) => words.has(w));
        expect(real, `${tag} opção ${i}: ${plain.join(' ')}`).toBe(i === v.correct);
      });
    }
  });
});

describe('wiring (Ep. 3)', () => {
  const vs = Object.values(ALL).flatMap((e) => variantsOf<WiringVariant>(e, 'wiring'));
  it('existe exatamente UMA ordem que chega no alvo; em debug, a ordem sabotada não chega', () => {
    expect(vs.length).toBeGreaterThan(0);
    for (const { tag, v } of vs) {
      expect(wiringSolutions(v.start, v.modules, v.slots, v.target), tag).toHaveLength(1);
      if (v.mode === 'debug') expect(runChain(v.start, v.chain!), tag).not.toBe(v.target);
    }
  });
});

describe('priority (Ep. 4)', () => {
  const vs = Object.values(ALL).flatMap((e) => variantsOf<PriorityVariant>(e, 'priority'));
  it('budget: a força bruta confirma optimalValue · select: correct tem pick itens', () => {
    expect(vs.length).toBeGreaterThan(0);
    for (const { tag, v } of vs) {
      if (v.mode === 'budget')
        expect(bestBudgetValue(v.tasks, v.capacity!), tag).toBe(v.optimalValue);
      else {
        expect(v.correct!.length, tag).toBe(v.pick);
        for (const id of v.correct!)
          expect(
            v.tasks.some((t) => t.id === id),
            `${tag} ${id}`,
          ).toBe(true);
      }
    }
  });
});

describe('boardChoice e gameTree (Ep. 5)', () => {
  it('jogo da velha: A e B = única casa que bloqueia; C = única armadilha dupla', () => {
    for (const { tag, v } of variantsOf<BoardChoiceVariant>(
      ep5 as unknown as AnyEpisode,
      'boardChoice',
    )) {
      const board = placeMove(v.board, v.spokenMove.cell, 'O');
      const level = tag.slice(-1);
      if (level === 'C') expect(forkMoves(board), tag).toEqual([v.answer]);
      else expect(threats(board, 'O'), tag).toEqual([v.answer]);
    }
  });
  it('minimax confirma a resposta como única melhor jogada', () => {
    for (const { tag, v } of variantsOf<GameTreeVariant>(ep5 as unknown as AnyEpisode, 'gameTree'))
      expect(bestMoves(v.tree), tag).toEqual([v.answer]);
  });
});

describe('Ep. 1 continua no formato novo (SPEC-02 Parte B)', () => {
  it('tem recap, carta e gancho', () => {
    expect(ep1.recapOfThis).toHaveLength(2);
    expect(ep1.card.art).toBe('card-ep1');
    expect(ep1.teaser.art).toBe('teaser-ep1');
  });
  it('tem missão bônus nos dois lados, com resposta em número e por extenso', () => {
    const e = ep1 as unknown as Episode;
    for (const side of ['red', 'blue'] as const)
      for (const lv of ['A', 'B', 'C'] as const) {
        const v = e.sides[side].bonus!.variants[lv] as RiddleVariant;
        expect(v.mode).toBe('text');
        expect(v.accept.some((a) => /^\d+$/.test(a))).toBe(true);
        expect(v.accept.length).toBeGreaterThan(1);
      }
  });
});

/**
 * Pedido da May (15/11): os dois lados trabalham a mesma lógica, mas NENHUMA resposta de um lado
 * pode aparecer como resposta (ou texto na tela) do outro, no mesmo nível. Assim, quem ouvir a
 * dupla do lado oposto falando não ganha a resposta.
 */
describe('lados espelhados sem respostas compartilhadas', () => {
  const norm = (x: unknown) => normalizeAnswer(typeof x === 'string' ? x : JSON.stringify(x));
  function answersAndScreen(c: Challenge, lv: 'A' | 'B' | 'C') {
    const answers: string[] = [];
    const screen: string[] = [];
    const v = c.variants[lv] as unknown as Record<string, unknown>;
    switch (c.type) {
      case 'quiz':
        for (const q of v.questions as { q: string; options: string[]; correct: number }[]) {
          answers.push(q.options[q.correct]!);
          screen.push(q.q);
        }
        break;
      case 'riddle':
        answers.push(...(v.accept as string[]));
        screen.push(v.text as string);
        break;
      case 'anagram':
        answers.push(v.answer as string);
        break;
      case 'punchCardRead':
        answers.push(v.answer as string);
        screen.push(JSON.stringify(v.columns));
        break;
      case 'punchCardWrite':
        answers.push(JSON.stringify(v.target));
        screen.push(v.shownTarget as string);
        break;
      case 'blockBuild':
      case 'blockDebug':
        answers.push(JSON.stringify(v.target));
        break;
      case 'cipher':
        if (v.answer) answers.push(v.answer as string);
        if (v.text) screen.push(v.text as string);
        if (v.options) screen.push(...(v.options as string[]));
        break;
      case 'wiring':
        answers.push(`${String(v.start)}>${String(v.target)}`);
        break;
      case 'priority':
        answers.push(JSON.stringify(v.correct ?? v.optimalValue));
        break;
    }
    return { answers: answers.map(norm), screen: screen.map(norm) };
  }
  for (const id of ['ep1', 'ep2', 'ep3', 'ep4']) {
    it(id, () => {
      const e = ALL[id] as Extract<AnyEpisode, { sides: unknown }>;
      const opt = (c: Challenge | undefined) => (c ? [c] : []);
      // 17/11: a etapa 2 de cada desafio também é comparada com a etapa 2 do outro lado
      const st2 = (list: Challenge[]) => list.map((c) => c.stage2);
      const pair = (side: 'red' | 'blue') => {
        const sd = e.sides[side];
        const base = [...sd.locks, sd.vault];
        return [...base, ...opt(sd.bonus), ...st2(base)];
      };
      const red = pair('red');
      const blue = pair('blue');
      expect(red.length, `${id}: os dois lados com o mesmo número de etapas`).toBe(blue.length);
      for (const lv of ['A', 'B', 'C'] as const)
        red.forEach((rc, i) => {
          if (!rc || !blue[i]) {
            expect(
              !rc && !blue[i],
              `${id} desafio ${i + 1}: etapa 2 nos dois lados ou em nenhum`,
            ).toBe(true);
            return;
          }
          const r = answersAndScreen(rc, lv);
          const b = answersAndScreen(blue[i]!, lv);
          const tag = `${id} nível ${lv} desafio ${i + 1}`;
          expect(
            r.answers.filter((a) => b.answers.includes(a)),
            `${tag}: mesma resposta`,
          ).toEqual([]);
          expect(
            r.answers.filter((a) => b.screen.includes(a)),
            `${tag}: resposta do Bando na tela dos Piratas`,
          ).toEqual([]);
          expect(
            b.answers.filter((a) => r.screen.includes(a)),
            `${tag}: resposta dos Piratas na tela do Bando`,
          ).toEqual([]);
          expect(
            r.screen.filter((q) => rc.type === 'quiz' && b.screen.includes(q)),
            `${tag}: pergunta igual`,
          ).toEqual([]);
        });
    });
  }
});

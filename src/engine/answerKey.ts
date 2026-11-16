/**
 * Gabarito curto de cada desafio, para o roteiro da Narradora (só na área da instrutora).
 * Função pura: transforma a variante do JSON numa frase "a resposta é...".
 */
import type { Challenge } from '@/content/types';
import type { Level } from '@/types/domain';
import { decodeColumns } from './challenges';
import { decodeText } from './cipher';
import { bestMoves } from './boardGames';
import { wiringSolutions } from './wiring';

const SYMBOL: Record<string, string> = { star: '★', dot: '●', line: '▬' };
const LETTERS = (n: number[]) => n.map((x) => String.fromCharCode(64 + x)).join('');

export function answerKey(c: Challenge, level: Level): string {
  switch (c.type) {
    case 'quiz': {
      const v = c.variants[level];
      return v.questions.map((q, i) => `${i + 1}) ${q.options[q.correct]}`).join(' · ');
    }
    case 'riddle':
      return c.variants[level].accept[0] ?? '';
    case 'anagram':
      return c.variants[level].answer;
    case 'punchCardRead': {
      const v = c.variants[level];
      return `${v.answer} (furos: ${decodeColumns(v.columns, 'digits')})`;
    }
    case 'punchCardWrite': {
      const v = c.variants[level];
      const word = v.decode === 'letters' ? ` = ${LETTERS(v.target)}` : '';
      return `furar as linhas ${v.target.join(', ')}${word}`;
    }
    case 'blockBuild':
    case 'blockDebug':
      return `padrão ${c.variants[level].target.map((s) => SYMBOL[s] ?? s).join('')}`;
    case 'cipher': {
      const v = c.variants[level];
      if (v.mode === 'verify') {
        const right = v.options![v.correct!]!;
        return `opção ${v.correct! + 1}: ${right} → ${decodeText(right, v.shift)} (chave ${v.shift})`;
      }
      return `${v.answer} (chave ${v.shift})`;
    }
    case 'wiring': {
      const v = c.variants[level];
      const sol = wiringSolutions(v.start, v.modules, v.slots, v.target)[0] ?? [];
      return `${v.start} → ${sol.join(' → ')} → ${v.target}`;
    }
    case 'priority': {
      const v = c.variants[level];
      if (v.mode === 'select') {
        const names = v.tasks.filter((t) => v.correct!.includes(t.id)).map((t) => t.label);
        return names.join(', ');
      }
      return `máximo de ${v.optimalValue} ${v.valueLabel ?? 'estrelas'} com até ${v.capacity} ${v.capacityLabel ?? ''}`.trim();
    }
    case 'boardChoice':
      return `casa ${c.variants[level].answer + 1} (de 1 a 9)`;
    case 'gameTree':
      return `${bestMoves(c.variants[level].tree).join(', ')}`;
  }
}

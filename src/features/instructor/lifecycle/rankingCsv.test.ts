import { describe, expect, it } from 'vitest';
import type { TeamDoc } from '@/types/domain';
import { rankingCsv } from './rankingCsv';

const team = (id: string, cityName: string, pirateName: string, totalPoints: number) =>
  ({ id, cityName, pirateName, totalPoints, episodesPlayed: 2 }) as unknown as TeamDoc & {
    id: string;
  };

describe('CSV do ranking (SPEC-02 A4)', () => {
  it('ordena, divide empates e usa ; com BOM', () => {
    const csv = rankingCsv(
      [team('a', 'Recife', 'Maré Alta', 5), team('b', 'Natal', 'Pérola; Azul', 9)],
      {
        school: 'Escola',
        className: '4º B',
        season: '2026-T4',
      },
    );
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines[1]).toBe('Posição;Codinome (Bando);Nome pirata;Pontos;Episódios jogados');
    expect(lines[2]).toBe('1;Natal;"Pérola; Azul";9;2');
    expect(lines[3]).toBe('2;Recife;Maré Alta;5;2');
  });
});

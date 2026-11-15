import { rankTeams } from '@/engine/ranking';
import type { TeamDoc } from '@/types/domain';

/**
 * CSV do ranking final da turma (SPEC-02 A4), para guardar antes de encerrar a temporada.
 * Só codinomes da lista fechada e pontos: nenhum dado pessoal. Separador ";" e BOM, que o
 * Excel em português abre direto.
 */
export function rankingCsv(
  teams: readonly (TeamDoc & { id: string })[],
  meta: { school: string; className: string; season: string },
): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ['Posição', 'Codinome (Bando)', 'Nome pirata', 'Pontos', 'Episódios jogados'];
  const rows = rankTeams(teams).map((r) => [
    r.position,
    r.team.cityName,
    r.team.pirateName,
    r.team.totalPoints,
    r.team.episodesPlayed,
  ]);
  const title = [
    `A Grande Caçada aos Códigos — ${meta.school} — ${meta.className} — temporada ${meta.season}`,
  ];
  return '﻿' + [title, head, ...rows].map((l) => l.map(esc).join(';')).join('\r\n') + '\r\n';
}

export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

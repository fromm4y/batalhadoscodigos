/**
 * Ordem dos episódios da temporada (RN-56).
 * Criar um episódio novo = adicionar `episodes/epN.json` e registrar aqui.
 * O conteúdo (JSON) é carregado a partir da Etapa 3.
 */
export type SeasonEntry = { id: string; number: number; title: string; available: boolean };

export const SEASON: SeasonEntry[] = [
  { id: 'ep1', number: 1, title: 'Máquina Analítica', available: true },
  { id: 'ep2', number: 2, title: 'Máquina Enigma', available: false },
  { id: 'ep3', number: 3, title: 'ENIAC', available: false },
  { id: 'ep4', number: 4, title: 'Apollo 11', available: false },
  { id: 'ep5', number: 5, title: 'Deep Blue', available: false },
];

/** Temporada gerada automaticamente pela data (decisão da May): "2026-T4" = 4º trimestre. */
export function seasonFromDate(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-T${quarter}`;
}

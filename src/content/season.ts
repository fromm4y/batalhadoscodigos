/**
 * Ordem dos episódios da temporada (RN-56).
 * Criar um episódio novo = adicionar `episodes/epN.json` e registrar aqui.
 * O conteúdo (JSON) é carregado a partir da Etapa 3.
 */
export type SeasonEntry = { id: string; number: number; title: string; available: boolean };

export const SEASON: SeasonEntry[] = [
  { id: 'ep1', number: 1, title: 'Máquina Analítica', available: true },
  { id: 'ep2', number: 2, title: 'Máquina Enigma', available: true },
  { id: 'ep3', number: 3, title: 'ENIAC', available: true },
  { id: 'ep4', number: 4, title: 'Apollo 11', available: false },
  { id: 'ep5', number: 5, title: 'Deep Blue', available: false },
];

/**
 * SPEC-02 Parte B: duas ordens prontas; a admin escolhe no painel (doc `config/season`).
 * Longa (até 18/12) tem os 5 episódios; curta (até 11/12) pula o Apollo 11 (decisão da May, 17/11).
 */
export type SeasonOrder = 'long' | 'short';
export const SEASON_ORDERS: Record<SeasonOrder, string[]> = {
  long: ['ep1', 'ep2', 'ep3', 'ep4', 'ep5'],
  // 17/11 (May): a curta fica com o ENIAC e tira o Apollo 11
  short: ['ep1', 'ep2', 'ep3', 'ep5'],
};
export const SEASON_ORDER_LABEL: Record<SeasonOrder, string> = {
  long: 'Longa (5 episódios, até 18/12)',
  short: 'Curta (4 episódios, até 11/12, sem o Apollo 11)',
};
export const DEFAULT_SEASON_ORDER: SeasonOrder = 'long';

export function isSeasonOrder(v: unknown): v is SeasonOrder {
  return v === 'long' || v === 'short';
}

/** Episódios da temporada ativa, na ordem. */
export function seasonEpisodes(order: SeasonOrder): SeasonEntry[] {
  return SEASON_ORDERS[order]
    .map((id) => SEASON.find((e) => e.id === id))
    .filter((e): e is SeasonEntry => !!e);
}

/** Próximo episódio da temporada ativa (null = este é o último). */
export function nextInSeason(order: SeasonOrder, episodeId: string): string | null {
  const list = SEASON_ORDERS[order];
  const i = list.indexOf(episodeId);
  return i >= 0 && i < list.length - 1 ? list[i + 1]! : null;
}

/**
 * Gancho do fim do episódio. O `teaser` de cada JSON descreve o episódio SEGUINTE da ordem longa
 * (o do Ep. 3 fala da Apollo), então o gancho para o episódio N mora no JSON do episódio N−1.
 * Assim, na temporada curta (sem o Apollo), o fim do Ep. 3 mostra o gancho do Deep Blue (que
 * está no JSON do Ep. 4).
 * Sem próximo episódio: encerramento da temporada (teaser do próprio episódio final).
 */
export function hookFor(
  order: SeasonOrder,
  episodeId: string,
):
  { kind: 'next'; nextId: string; teaserFrom: string } | { kind: 'seasonEnd'; teaserFrom: string } {
  const nextId = nextInSeason(order, episodeId);
  if (!nextId) return { kind: 'seasonEnd', teaserFrom: episodeId };
  const next = SEASON.find((e) => e.id === nextId)!;
  const prevLong = SEASON.find((e) => e.number === next.number - 1);
  return { kind: 'next', nextId, teaserFrom: prevLong?.id ?? episodeId };
}

/** Temporada gerada automaticamente pela data (decisão da May): "2026-T4" = 4º trimestre. */
export function seasonFromDate(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-T${quarter}`;
}

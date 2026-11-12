/**
 * Carregamento dos episódios (JSON). O motor completo e os tipos de conteúdo chegam na Etapa 3.
 * Import dinâmico: o JSON só é baixado quando a dupla entra no jogo.
 */
export type EpisodeMeta = {
  id: string;
  number: number;
  title: string;
  curiosities: string[];
  nextHook: string;
};

const loaders: Record<string, () => Promise<{ default: EpisodeMeta }>> = {
  ep1: () => import('./ep1.json') as Promise<{ default: EpisodeMeta }>,
};

export async function loadEpisodeMeta(id: string): Promise<EpisodeMeta | null> {
  const load = loaders[id];
  return load ? (await load()).default : null;
}

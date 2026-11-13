/**
 * Carregamento dos episódios (JSON). Import dinâmico: o conteúdo só é baixado quando a dupla entra no jogo.
 * Criar um episódio novo = adicionar `epN.json` aqui e registrar em `season.ts`.
 */
import type { Episode } from '../types';

export type EpisodeMeta = Pick<Episode, 'id' | 'number' | 'title' | 'curiosities' | 'nextHook'>;

const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  ep1: () => import('./ep1.json'),
};

export async function loadEpisode(id: string): Promise<Episode | null> {
  const load = loaders[id];
  return load ? ((await load()).default as Episode) : null;
}

export async function loadEpisodeMeta(id: string): Promise<EpisodeMeta | null> {
  return loadEpisode(id);
}

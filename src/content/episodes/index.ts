/**
 * Carregamento dos episódios (JSON). Import dinâmico: o conteúdo só é baixado quando a dupla entra no jogo.
 * Criar um episódio novo = adicionar `epN.json` aqui e registrar em `season.ts`.
 */
import type { AnyEpisode, Episode } from '../types';

export type EpisodeMeta = Pick<
  AnyEpisode,
  'id' | 'number' | 'title' | 'curiosities' | 'teaser' | 'card'
>;

const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  ep1: () => import('./ep1.json'),
  ep2: () => import('./ep2.json'),
  ep3: () => import('./ep3.json'),
  ep4: () => import('./ep4.json'),
  ep5: () => import('./ep5.json'),
};

/** Qualquer episódio (inclusive o cooperativo). */
export async function loadAnyEpisode(id: string): Promise<AnyEpisode | null> {
  const load = loaders[id];
  return load ? ((await load()).default as AnyEpisode) : null;
}

/** Episódio Bando × Piratas (o jogo versus). O cooperativo (Ep. 5) devolve null aqui. */
export async function loadEpisode(id: string): Promise<Episode | null> {
  const e = await loadAnyEpisode(id);
  return e && e.mode !== 'coop' ? e : null;
}

export async function loadEpisodeMeta(id: string): Promise<EpisodeMeta | null> {
  return loadAnyEpisode(id);
}

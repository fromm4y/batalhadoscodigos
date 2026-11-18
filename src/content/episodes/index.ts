/**
 * Carregamento dos episódios (JSON). Import dinâmico: o conteúdo só é baixado quando a dupla entra no jogo.
 * Criar um episódio novo = adicionar `epN.json` aqui e registrar em `season.ts`.
 */
import { asVersus } from '@/engine/coop';
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

/**
 * Episódio no formato do jogo. O cooperativo (Ep. 5) vem com o conteúdo da Aliança nos dois
 * lados e `alliance: true` (SPEC-03 §4).
 */
export async function loadEpisode(id: string): Promise<Episode | null> {
  const e = await loadAnyEpisode(id);
  if (!e) return null;
  return e.mode === 'coop' ? asVersus(e) : e;
}

export async function loadEpisodeMeta(id: string): Promise<EpisodeMeta | null> {
  return loadAnyEpisode(id);
}

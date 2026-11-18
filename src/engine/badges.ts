/**
 * Ficha que evolui e selos (SPEC-02 Parte D). Funções puras.
 * - Nível da dupla pelos episódios jogados (D1), com nomes diferentes no Bando e nos Piratas.
 * - Carimbo por episódio: lado jogado e resultado.
 * - Selos (D2), concedidos no fim do episódio. Selos não dão pontos [PADRÃO].
 */
import type { Badge, BadgeId, Side, Stamp, StampResult } from '@/types/domain';

export type { Badge, BadgeId, Stamp, StampResult };

export const BADGES: Record<BadgeId, { icon: string; name: string; text: string }> = {
  cofreRelampago: {
    icon: '⚡',
    name: 'Cofre Relâmpago',
    text: 'Resolveu o Cofre mais rápido da turma no episódio.',
  },
  semDicas: { icon: '🧠', name: 'Sem Dicas', text: 'Terminou o episódio sem abrir nenhuma dica.' },
  virada: { icon: '🔄', name: 'Virada', text: 'Venceu depois de começar o Cofre atrás na barra.' },
  duasCaras: { icon: '🎭', name: 'Duas Caras', text: 'Já jogou nos dois lados na temporada.' },
  ouvidoAtento: {
    icon: '🎧',
    name: 'Ouvido Atento',
    text: 'Acertou de primeira os desafios com pista falada.',
  },
  colecionador: {
    icon: '🗂️',
    name: 'Colecionador',
    text: 'Tem todas as cartas da temporada.',
  },
  missaoBonus: { icon: '🌟', name: 'Missão Bônus', text: 'Cumpriu a missão bônus do episódio.' },
};

/** Selos que valem uma vez na temporada (os outros podem vir em cada episódio). */
const ONCE: BadgeId[] = ['duasCaras', 'colecionador'];

// ---------- D1: nível pela quantidade de episódios jogados ----------
const LEVELS: Record<Side, string[]> = {
  red: ['Novato', 'Recruta', 'Agente', 'Especialista', 'Mestre do Plano', 'Lenda'],
  blue: ['Aprendiz', 'Grumete', 'Marujo', 'Imediato', 'Capitão de Fragata', 'Lenda dos Mares'],
};
export function teamLevel(episodesPlayed: number, side: Side): string {
  const list = LEVELS[side];
  return list[Math.max(0, Math.min(list.length - 1, episodesPlayed))]!;
}

/** Resultado do carimbo a partir do vencedor do confronto. */
export function stampResult(side: Side, winner: Side | 'draw' | null | undefined): StampResult {
  if (!winner) return 'jogou';
  if (winner === 'draw') return 'empate';
  return winner === side ? 'venceu' : 'perdeu';
}

/** Carimbo novo no fim do episódio (jogar de novo o mesmo episódio troca pelo mais recente). */
export function addStamp(stamps: Stamp[] | undefined, s: Stamp): Stamp[] {
  return [...(stamps ?? []).filter((x) => x.episodeId !== s.episodeId), s];
}

// ---------- D2: selos ----------
export type BadgeInput = {
  episodeId: string;
  side: Side;
  /** resultado do confronto e quem estava na frente ao liberar o Cofre */
  winner: Side | 'draw' | null;
  vaultLeader: Side | null;
  /** resolveu o Cofre neste episódio */
  vaultSolved: boolean;
  /** esta dupla foi a mais rápida da turma no Cofre (empate vale para todas) */
  fastestVault: boolean;
  hints: Record<string, number> | undefined;
  misses: Record<string, number> | undefined;
  /** desafios com pista falada (etapa 1 do cadeado da transmissão) e se foram abertos */
  spokenKeys: string[];
  spokenOpened: boolean;
  bonusSolved: boolean;
  /** carimbos já com o deste episódio */
  stamps: Stamp[];
  /** cartas já com a deste episódio, e os episódios da temporada ativa */
  cardEpisodes: string[];
  seasonEpisodes: string[];
};

export function badgesEarned(i: BadgeInput): BadgeId[] {
  const out: BadgeId[] = [];
  if (i.vaultSolved && i.fastestVault) out.push('cofreRelampago');
  if (i.vaultSolved && !Object.values(i.hints ?? {}).some((n) => n > 0)) out.push('semDicas');
  if (i.winner === i.side && i.vaultLeader && i.vaultLeader !== i.side) out.push('virada');
  const sides = new Set(i.stamps.map((s) => s.side));
  if (sides.has('red') && sides.has('blue')) out.push('duasCaras');
  if (
    i.spokenKeys.length > 0 &&
    i.spokenOpened &&
    i.spokenKeys.every((k) => !i.misses?.[k] && !i.hints?.[k])
  )
    out.push('ouvidoAtento');
  if (i.seasonEpisodes.length > 0 && i.seasonEpisodes.every((e) => i.cardEpisodes.includes(e)))
    out.push('colecionador');
  if (i.bonusSolved) out.push('missaoBonus');
  return out;
}

/** Junta os selos novos sem repetir (os de "uma vez" não repetem nem em outro episódio). */
export function addBadges<T>(
  have: Badge<T>[] | undefined,
  ids: BadgeId[],
  episodeId: string,
  at: T,
): Badge<T>[] {
  const list = [...(have ?? [])];
  for (const id of ids) {
    const dup = list.some((b) => b.id === id && (ONCE.includes(id) || b.episodeId === episodeId));
    if (!dup) list.push({ id, episodeId, at });
  }
  return list;
}

/** Quantas vezes a dupla ganhou cada selo (para a ficha: ⚡×2). */
export function badgeCounts(badges: Badge[] | undefined): [BadgeId, number][] {
  const m = new Map<BadgeId, number>();
  for (const b of badges ?? []) m.set(b.id, (m.get(b.id) ?? 0) + 1);
  return (Object.keys(BADGES) as BadgeId[]).filter((id) => m.has(id)).map((id) => [id, m.get(id)!]);
}

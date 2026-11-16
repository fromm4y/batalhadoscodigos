/**
 * Placar "Corrida até o Cofre" do projetor (pedido da May, 16/11): quem está mais perto do Cofre,
 * SEM mostrar pontos. Função pura.
 */
import type { PlayerDoc } from '@/types/domain';

type Ms = { toMillis(): number } | null | undefined;
const ms = (t: Ms) => t?.toMillis?.() ?? Number.POSITIVE_INFINITY;

export type RaceEntry<T> = {
  player: T;
  /** 0–3 cadeados abertos + 1 se resolveu o Cofre (máx. 4) */
  steps: number;
  /** posição; empate exato (mesmos passos e sem horário) divide a posição */
  place: number;
};

export function raceSteps(p: Pick<PlayerDoc, 'progress'>): number {
  return p.progress.lockIndex + (p.progress.vaultSolvedAt ? 1 : 0);
}

/** Horário do último passo dado (quem chegou antes fica na frente). */
function lastStepAt(p: Pick<PlayerDoc, 'progress'>): number {
  if (p.progress.vaultSolvedAt) return ms(p.progress.vaultSolvedAt);
  const i = p.progress.lockIndex;
  return i > 0 ? ms(p.progress.locksOpenedAt[i - 1]) : Number.POSITIVE_INFINITY;
}

/** Mais passos primeiro; com os mesmos passos, quem chegou antes. */
export function raceOrder<T extends Pick<PlayerDoc, 'progress' | 'side'>>(
  players: T[],
): RaceEntry<T>[] {
  const rows = players
    .filter((p) => p.side)
    .map((player) => ({ player, steps: raceSteps(player), at: lastStepAt(player) }))
    .sort((a, b) => b.steps - a.steps || a.at - b.at);
  const out: RaceEntry<T>[] = [];
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    const tied = prev && prev.steps === r.steps && prev.at === r.at;
    out.push({ player: r.player, steps: r.steps, place: tied ? out[i - 1]!.place : i + 1 });
  });
  return out;
}

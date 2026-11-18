/**
 * Ep. 5 — modo cooperativo (SPEC-03 §4.1). Funções puras, sem Firebase.
 * A Aliança reaproveita o cabo de guerra: a turma puxa pelo lado `red` (TURMA) e a máquina
 * pelo `blue` (MÁQUINA), num único confronto `coop` (RN-C2).
 */
import { GAME_RULES } from '@/config/gameRules';
import type { CoopEpisode, Episode, SideContent } from '@/content/types';
import type { CoopState, LedgerReason, MatchDoc, Side } from '@/types/domain';

export const COOP_MATCH_ID = 'coop';
/** lado da turma e da máquina no confronto da Aliança */
export const COOP_CLASS_SIDE: Side = 'red';
export const COOP_MACHINE_SIDE: Side = 'blue';
export const ALLIANCE_NAME = 'A Aliança';

/** O loader entrega o cooperativo no formato do jogo: o conteúdo da Aliança nos dois lados. */
export function asVersus(e: CoopEpisode): Episode {
  const side: SideContent = { name: ALLIANCE_NAME, ...e.coop };
  const { coop: _coop, mode: _mode, intro, ...rest } = e;
  return {
    ...rest,
    mode: 'versus',
    alliance: true,
    intro: { comic: intro.comic, red: intro.coop, blue: intro.coop },
    sides: { red: side, blue: side },
  };
}

export const newCoopState = (teams: string[] = []): CoopState => ({
  teams: [...new Set(teams)],
  vaultSolvers: [],
  reinforcements: {},
});

export const isCoopMatch = (m: Pick<MatchDoc, 'coop'> | null | undefined): boolean => !!m?.coop;

/**
 * RN-C3: a força de cada puxão pela turma é dividida pelo tamanho da Aliança, para turmas
 * grandes e pequenas terem o mesmo ritmo. `force` é o puxão normal (cadeado = `pull.lockOpen`).
 */
export function coopPull(force: number, teams: number): number {
  const scaled =
    (force * GAME_RULES.coop.pullTotal) / GAME_RULES.pull.lockOpen / Math.max(1, teams);
  return Math.max(1, Math.round(scaled));
}

/** RN-C5: quantas duplas precisam abrir o Cofre antes da máquina. */
export function vaultGoal(teams: number): number {
  return Math.max(1, Math.ceil(Math.max(1, teams) * GAME_RULES.coop.winShare));
}

/** Depois de uma dupla abrir o Cofre: a turma venceu? */
export function classWins(st: CoopState): boolean {
  return st.vaultSolvers.length >= vaultGoal(st.teams.length);
}

/** RN-C6: pontos do fim para TODAS as duplas da Aliança. */
export function coopEndAwards(
  st: CoopState,
  winner: Side | 'draw' | null,
): { teamId: string; reason: LedgerReason; delta: number }[] {
  const win = winner === COOP_CLASS_SIDE;
  return st.teams.map((teamId) => ({
    teamId,
    reason: win ? 'coop_win' : 'coop_play',
    delta: win ? GAME_RULES.points.coopWin : GAME_RULES.points.coopPlay,
  }));
}

/** RN-C7: a dupla pode mandar reforço? (abriu o Cofre e ainda não mandou todos) */
export function canReinforce(st: CoopState, teamId: string): boolean {
  const sent = Object.keys(st.reinforcements).filter((k) => k === teamId).length;
  return st.vaultSolvers.includes(teamId) && sent < GAME_RULES.coop.reinforcementsPerTeam;
}

/** Quem pode receber reforço: está na Aliança, não abriu o Cofre e ainda não recebeu. */
export function reinforceTargets(st: CoopState): string[] {
  const got = new Set(Object.values(st.reinforcements));
  return st.teams.filter((t) => !st.vaultSolvers.includes(t) && !got.has(t));
}

/** O reforço que esta dupla recebeu (quem mandou), se houver. */
export function reinforcementFor(st: CoopState, teamId: string): string | null {
  return Object.entries(st.reinforcements).find(([, to]) => to === teamId)?.[0] ?? null;
}

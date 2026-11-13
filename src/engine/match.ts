/**
 * Confrontos e cabo de guerra (SPEC 7.4, 7.5, 7.9, 7.10). Funções puras, sem Firebase.
 */
import { GAME_RULES } from '@/config/gameRules';
import type {
  AbilityId,
  ActiveEffect,
  GameMode,
  Level,
  MatchDoc,
  MatchLogEntry,
  Side,
} from '@/types/domain';

export const other = (s: Side): Side => (s === 'red' ? 'blue' : 'red');

// ---------- Formação dos confrontos (RN-12, RN-13) ----------
export type Candidate = { teamId: string; side: Side | null; mode: GameMode | null };
export type PlannedMatch = {
  id: string;
  redTeamId: string | null;
  blueTeamId: string | null;
  machineSide: Side | null;
};
export type Formation = { matches: PlannedMatch[]; sideBonus: string[] };

export const machineMatchId = (teamId: string) => `maq_${teamId}`;
export const pvpMatchId = (red: string, blue: string) => `pvp_${red}_${blue}`;

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const vsMachine = (teamId: string, side: Side): PlannedMatch => ({
  id: machineMatchId(teamId),
  redTeamId: side === 'red' ? teamId : null,
  blueTeamId: side === 'blue' ? teamId : null,
  machineSide: other(side),
});

/**
 * RN-12: modo máquina → contra o robô; os de "pessoas" formam pares red × blue embaralhados;
 * quem sobra joga contra a máquina no lado que escolheu. Bônus de lado vazio para o lado menor.
 * Quem não escolheu lado vai para o lado com menos gente (decisão da Etapa 4).
 * RN-13: uma única dupla → contra a máquina.
 */
export function formMatches(candidates: Candidate[], rand: () => number = Math.random): Formation {
  const withSide = candidates.map((c) => ({ ...c }));
  for (const c of withSide.filter((x) => !x.side)) {
    const reds = withSide.filter((x) => x.side === 'red').length;
    const blues = withSide.filter((x) => x.side === 'blue').length;
    c.side = reds <= blues ? 'red' : 'blue';
    c.mode ??= 'pessoas';
  }
  const matches: PlannedMatch[] = [];
  const people = candidates.length > 1 ? withSide.filter((c) => c.mode !== 'maquina') : [];
  for (const c of withSide.filter((x) => !people.includes(x)))
    matches.push(vsMachine(c.teamId, c.side!));

  const reds = shuffle(
    people.filter((c) => c.side === 'red'),
    rand,
  );
  const blues = shuffle(
    people.filter((c) => c.side === 'blue'),
    rand,
  );
  const pairs = Math.min(reds.length, blues.length);
  for (let i = 0; i < pairs; i++) {
    const r = reds[i]!.teamId;
    const b = blues[i]!.teamId;
    matches.push({ id: pvpMatchId(r, b), redTeamId: r, blueTeamId: b, machineSide: null });
  }
  for (const c of [...reds.slice(pairs), ...blues.slice(pairs)])
    matches.push(vsMachine(c.teamId, c.side!));

  const diff = reds.length - blues.length;
  const sideBonus =
    Math.abs(diff) >= GAME_RULES.sideBonusMinDifference
      ? (diff > 0 ? blues : reds).map((c) => c.teamId)
      : [];
  return { matches, sideBonus };
}

// ---------- Cabo de guerra (RN-15 a RN-21) ----------
export function activeEffects(effects: ActiveEffect[], now: number): ActiveEffect[] {
  return effects.filter((e) => e.kind === 'shield' || e.until > now);
}

export function hasEffect(
  effects: ActiveEffect[],
  kind: ActiveEffect['kind'],
  target: Side,
  now: number,
): boolean {
  return activeEffects(effects, now).some((e) => e.kind === kind && e.target === target);
}

/** Limite da barra: ±60 antes de alguém vencer (RN-17); ±100 só com vencedor. */
export function clampBar(bar: number): number {
  const lim = GAME_RULES.bar.preVaultLimit;
  return Math.max(-lim, Math.min(lim, bar));
}

export type PullResult = {
  bar: number;
  effects: ActiveEffect[];
  applied: number;
  blocked: boolean;
};

/**
 * Aplica um puxão do lado `side` com força `force` (RN-21): Escudo anula o puxão (e é consumido),
 * Âncora divide a força. Bando diminui a barra; Piratas aumentam.
 */
export function applyPull(
  match: Pick<MatchDoc, 'bar' | 'effects'>,
  side: Side,
  force: number,
  now: number,
): PullResult {
  let effects = activeEffects(match.effects, now);
  const shield = effects.find((e) => e.kind === 'shield' && e.target === side);
  if (shield) {
    effects = effects.filter((e) => e !== shield);
    return { bar: match.bar, effects, applied: 0, blocked: true };
  }
  const anchored = effects.some((e) => e.kind === 'anchor' && e.target === side);
  const applied = Math.round(anchored ? force * GAME_RULES.abilities.anchorMultiplier : force);
  const bar = clampBar(match.bar + (side === 'red' ? -applied : applied));
  return { bar, effects, applied: Math.abs(bar - match.bar), blocked: false };
}

/** Quem está à frente na barra (Bando = negativo). */
export function leader(bar: number): Side | null {
  return bar < 0 ? 'red' : bar > 0 ? 'blue' : null;
}

/** A barra está a favor do rival de `side`? (RN-38) */
export const barFavorsRival = (bar: number, side: Side) => leader(bar) === other(side);

/** Barra final quando alguém vence (RN-19). */
export const winningBar = (side: Side) =>
  side === 'red' ? GAME_RULES.bar.min : GAME_RULES.bar.max;

/** RN-20: fim sem Cofre resolvido → vence quem a barra favorece; 0 = empate. */
export function resolveByBar(bar: number): Side | 'draw' {
  return leader(bar) ?? 'draw';
}

export function pushLog(log: MatchLogEntry[], entry: MatchLogEntry): MatchLogEntry[] {
  return [...log, entry].slice(-GAME_RULES.match.logSize);
}

// ---------- Habilidades (7.9) ----------
export const SIDE_ABILITIES: Record<Side, AbilityId[]> = {
  red: ['interferencia', 'disfarce', 'planoB'],
  blue: ['ancora', 'escudo', 'bussola'],
};

/**
 * RN-37 / RN-38: depois de resolver o desafio de número `solved`, a dupla ganha uma habilidade?
 * A cada 2 desafios; ou a cada desafio se a barra estiver a favor do rival.
 */
export function earnsAbility(solved: number, losing: boolean): boolean {
  const every = losing
    ? GAME_RULES.abilities.solvedPerAbilityWhenLosing
    : GAME_RULES.abilities.solvedPerAbility;
  return solved > 0 && solved % every === 0;
}

/** Sorteia uma habilidade do lado que a dupla ainda não tem. */
export function pickAbility(
  side: Side,
  owned: AbilityId[],
  rand: () => number = Math.random,
): AbilityId | null {
  const left = SIDE_ABILITIES[side].filter((a) => !owned.includes(a));
  return left.length ? left[Math.floor(rand() * left.length)]! : null;
}

export type AbilityOutcome =
  | { kind: 'effect'; effect: ActiveEffect }
  /** Plano B / Bússola: Dica 1 grátis no desafio atual */
  | { kind: 'freeHint' };

/** Efeito da habilidade usada por `user` contra o rival (7.9). */
export function abilityEffect(id: AbilityId, user: Side, now: number): AbilityOutcome {
  const rival = other(user);
  const A = GAME_RULES.abilities;
  switch (id) {
    case 'interferencia':
      return {
        kind: 'effect',
        effect: { kind: 'freeze', target: rival, until: now + A.interferenceFreezeSeconds * 1000 },
      };
    case 'ancora':
      return {
        kind: 'effect',
        effect: { kind: 'anchor', target: rival, until: now + A.anchorDurationSeconds * 1000 },
      };
    case 'disfarce':
      return {
        kind: 'effect',
        effect: { kind: 'disguise', target: rival, until: now + A.disguiseDurationSeconds * 1000 },
      };
    case 'escudo':
      return { kind: 'effect', effect: { kind: 'shield', target: rival } };
    case 'planoB':
    case 'bussola':
      return { kind: 'freeHint' };
  }
}

export const ABILITY_INFO: Record<AbilityId, { name: string; icon: string; text: string }> = {
  interferencia: { name: 'Interferência', icon: '📡', text: 'Congela a tela do rival por 10 s.' },
  disfarce: { name: 'Disfarce', icon: '🥸', text: 'O rival não vê a barra por 30 s.' },
  planoB: { name: 'Plano B', icon: '📋', text: 'Uma Dica 1 grátis neste desafio.' },
  ancora: { name: 'Âncora', icon: '⚓', text: 'Os puxões do rival valem metade por 30 s.' },
  escudo: { name: 'Escudo', icon: '🛡️', text: 'Anula o próximo puxão do rival.' },
  bussola: { name: 'Bússola', icon: '🧭', text: 'Uma Dica 1 grátis neste desafio.' },
};

// ---------- A máquina (RN-42 a RN-44) ----------
export function machineDelayMs(
  level: Level,
  slot: 'lock' | 'vault',
  rand: () => number = Math.random,
): number {
  const [min, max] = GAME_RULES.machineSolveSeconds[level][slot];
  return Math.round((min + rand() * (max - min)) * 1000);
}

/** RN-40: Interferência contra a máquina atrasa o próximo desafio dela pelo mesmo tempo. */
export function machineDelayFromEffect(effect: ActiveEffect): number {
  return effect.kind === 'freeze' ? GAME_RULES.abilities.interferenceFreezeSeconds * 1000 : 0;
}

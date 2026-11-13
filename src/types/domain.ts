/**
 * Tipos do domínio — espelham o SPEC.md (seções 3, 6 e 9.5).
 * Os tipos de conteúdo de episódio (seção 11) entram na Etapa 3.
 */
import type { Timestamp } from 'firebase/firestore';

export type Level = 'A' | 'B' | 'C';
export type Side = 'red' | 'blue';
export type Grade = 4 | 5 | 6 | 7 | 8 | 9;
export type Shift = 'manha' | 'tarde';
export type Phase = 'lobby' | 'planning' | 'locks' | 'vault' | 'end';
export type Role = 'admin' | 'instructor';
export type GameMode = 'pessoas' | 'maquina';

export type AbilityId =
  | 'interferencia' // Bando — atrapalhar
  | 'disfarce' // Bando — proteger
  | 'planoB' // Bando — ajudar
  | 'ancora' // Piratas — atrapalhar
  | 'escudo' // Piratas — proteger
  | 'bussola'; // Piratas — ajudar

export type LedgerReason =
  | 'lock_open'
  | 'lock_first'
  | 'event_ok'
  | 'vault_win'
  | 'draw'
  | 'side_bonus'
  | 'wrong_answer'
  | 'hint_1'
  | 'hint_2'
  | 'manual';

/** Seção 9.5 */
export type AvatarConfig = {
  skin: 1 | 2 | 3 | 4 | 5 | 6;
  hair: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  hairColor: 1 | 2 | 3 | 4 | 5;
  eyes: 1 | 2 | 3 | 4;
  mouth: 1 | 2 | 3 | 4;
  accessory: 0 | 1 | 2 | 3;
};

// ---------- Documentos do Firestore (seção 6.1) ----------

export type AllowedInstructorDoc = {
  email: string;
  role: Role;
  addedBy: string;
  addedAt: Timestamp;
  active: boolean;
};

export type InstructorDoc = {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: Timestamp;
};

export type SchoolDoc = { name: string; active: boolean };

export type ClassDoc = {
  schoolId: string;
  instructorId: string;
  name: string;
  grade: Grade;
  level: Level;
  shift: Shift;
  season: string;
  archived: boolean;
  createdAt: Timestamp;
};

export type TeamDoc = {
  cityName: string;
  pirateName: string;
  avatar: AvatarConfig;
  totalPoints: number;
  episodesPlayed: number;
  badges: string[];
  createdAt: Timestamp;
};

export type LedgerEntryDoc = {
  sessionId: string;
  episodeId: string;
  delta: number;
  reason: LedgerReason;
  at: Timestamp;
  by: 'game' | string;
};

export type SessionDoc = {
  classId: string;
  instructorId: string;
  episodeId: string;
  code: string;
  status: 'open' | 'finished';
  phase: Phase;
  phaseStartedAt: Timestamp;
  matchesFormed: boolean;
  freeze: { active: boolean; message: string };
  transmission: { active: boolean; id: string; startedAt: Timestamp | null };
  museumEvent: {
    status: 'idle' | 'running' | 'done';
    startedAt: Timestamp | null;
    triggeredBy: 'auto' | 'instructor' | null;
  };
  autoEventAt: Timestamp | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
};

/** Estado da dupla nesta sessão (SPEC 6.1). Campos de jogo detalhados nas próximas etapas. */
export type PlayerDoc = {
  teamId: string;
  uid: string;
  side: Side | null;
  /** modo escolhido no planejamento (RN-11) */
  mode?: GameMode | null;
  matchId: string | null;
  connected: boolean;
  lastSeenAt: Timestamp | null;
  progress: {
    lockIndex: 0 | 1 | 2 | 3;
    locksOpenedAt: (Timestamp | null)[];
    vaultSolvedAt: Timestamp | null;
    eventResult: 'pending' | 'ok' | 'failed';
    jailUntil: Timestamp | null;
    heardTransmission: boolean;
  };
  hints: Record<string, 0 | 1 | 2>;
  helpUsed: boolean;
  abilities: { owned: AbilityId[]; used: AbilityId[] };
  solvedCount: number;
  episodePoints: number;
  finishedAt: Timestamp | null;
};

/** Efeito de habilidade ativo num confronto (seção 7.9). `target` = lado afetado. */
export type ActiveEffect =
  | { kind: 'freeze'; target: Side; until: number } // Interferência: tela congelada
  | { kind: 'anchor'; target: Side; until: number } // Âncora: puxões valem metade
  | { kind: 'disguise'; target: Side; until: number } // Disfarce: não vê a barra
  | { kind: 'shield'; target: Side }; // Escudo: anula o próximo puxão de `target`

export type MatchLogEntry = { at: number; side: Side; type: string; text: string };

/** Progresso do robô (só em confrontos contra a máquina; roda no navegador da dupla, SPEC 5.2). */
export type MachineState = {
  lockIndex: number;
  /** fase em que `nextAt` foi sorteado */
  phase: Phase | null;
  /** hora (servidor, ms) em que o robô resolve o próximo desafio */
  nextAt: number | null;
  vaultSolved: boolean;
  usedAbilities: AbilityId[];
};

/** sessions/{id}/matches/{matchId} (SPEC 6.1) */
export type MatchDoc = {
  redTeamId: string | null;
  blueTeamId: string | null;
  machineSide: Side | null;
  bar: number;
  effects: ActiveEffect[];
  vaultLeader: Side | null;
  winner: Side | 'draw' | null;
  resolvedAt: Timestamp | null;
  log: MatchLogEntry[];
  machine: MachineState | null;
};

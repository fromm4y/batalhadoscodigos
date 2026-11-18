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
/** 'coop' (Ep. 5): a turma inteira contra a máquina, sem lados (SPEC-03 §4). */
export type GameMode = 'pessoas' | 'maquina' | 'coop';

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
  /** Cofre Relâmpago (16/11) */
  | 'vault_fast'
  /** Missão bônus (16/11) */
  | 'bonus_mission'
  /** Ep. 5 (coop): a turma venceu a máquina / participação (RN-C6) */
  | 'coop_win'
  | 'coop_play'
  | 'manual';

/** Seção 9.5 */
export type AvatarConfig = {
  skin: 1 | 2 | 3 | 4 | 5 | 6;
  hair: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  hairColor: 1 | 2 | 3 | 4 | 5;
  eyes: 1 | 2 | 3 | 4;
  mouth: 1 | 2 | 3 | 4;
  accessory: 0 | 1 | 2 | 3;
  /** personagem-imagem escolhido (src/content/characters.ts); sem ele, vale o desenho acima */
  character?: string;
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
  /** SPEC-02 A4: quando a temporada da turma foi encerrada (dados apagados) */
  seasonClosedAt?: Timestamp;
};

/** Carta do Álbum (SPEC-02 C2): concedida na fase `end` para quem jogou o episódio. */
export type CardVariant = 'normal' | 'dourada';
export type TeamCard = { episodeId: string; variant: CardVariant; earnedAt: Timestamp };

/** Efeito de carta esperando o momento certo (Bombe Turbinada, Válvula Reserva, Contagem). */
export type CardBoost = 'extraPull' | 'forgiveMiss' | 'lightningPlus';

/** Selos (SPEC-02 D2) e carimbos da ficha (D1). Regras em src/engine/badges.ts. */
export type BadgeId =
  | 'cofreRelampago'
  | 'semDicas'
  | 'virada'
  | 'duasCaras'
  | 'ouvidoAtento'
  | 'colecionador'
  | 'missaoBonus';
export type Badge<T = unknown> = { id: BadgeId; episodeId: string; at: T };
export type StampResult = 'venceu' | 'perdeu' | 'empate' | 'jogou';
export type Stamp = { episodeId: string; side: Side; result: StampResult };

export type TeamDoc = {
  cityName: string;
  pirateName: string;
  avatar: AvatarConfig;
  totalPoints: number;
  /** episódios jogados (= carimbos na ficha; SPEC-02 D1) */
  episodesPlayed: number;
  /** selos (SPEC-02 D2) */
  badges: Badge<Timestamp>[];
  /** carimbos da ficha: um por episódio jogado, com lado e resultado */
  stamps?: Stamp[];
  /** Álbum do Museu (inventário de cartas) */
  cards?: TeamCard[];
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

/**
 * "Anteriormente na Caçada" (SPEC-02 C1): números reais da aula anterior da turma, calculados
 * pelo servidor quando a sessão abre. Sem dado pessoal: só nomes de dupla da lista fechada.
 */
export type PreviousSummary = {
  episodeId: string;
  wins: { red: number; blue: number; machine: number; draw: number };
  /** dupla destaque (mais pontos na aula), com o nome do lado que jogou */
  highlight: { name: string; side: Side; points: number } | null;
  vaultOpened: number;
  teams: number;
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
  /** `startedAtMs`: relógio do painel, para descontar o tempo congelado (RN-46) */
  freeze: { active: boolean; message: string; startedAtMs?: number | null };
  transmission: { active: boolean; id: string; startedAt: Timestamp | null };
  museumEvent: {
    status: 'idle' | 'running' | 'done';
    startedAt: Timestamp | null;
    triggeredBy: 'auto' | 'instructor' | null;
  };
  autoEventAt: Timestamp | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  /** "continuar a aula anterior" (17/11): sessão de onde vem o progresso */
  resumeFrom?: string | null;
  /** histórico da turma quando a sessão abriu (Álbum e "Anteriormente") */
  history?: { played: string[]; previously: PreviousSummary | null };
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
    /** etapa do cadeado atual: 0 = primeira, 1 = segunda (17/11) */
    step?: 0 | 1;
    /** etapa do Cofre (separada: dá para chegar ao Cofre no meio de um cadeado, RN-09) */
    vaultStep?: 0 | 1;
  };
  hints: Record<string, 0 | 1 | 2>;
  /** erros por desafio (combo: abrir de primeira, sem erro e sem dica) */
  misses?: Record<string, number>;
  /** missão bônus resolvida (16/11) */
  bonusSolvedAt?: Timestamp | null;
  /** veio da aula anterior com o progresso (17/11) */
  resumed?: boolean;
  /** carta do Álbum equipada neste episódio (id do episódio de origem) */
  equippedCard?: string | null;
  /** quantas vezes o poder da carta já foi usado neste episódio */
  cardUses?: number;
  /** poder que espera o momento certo (próximo cadeado, próximo erro, Cofre) */
  cardBoost?: CardBoost | null;
  helpUsed: boolean;
  /** Ep. 5 (coop, RN-C7): a dupla que mandou o reforço que esta dupla já recebeu */
  reinforcedBy?: string | null;
  /** RN-07: a Narradora adiantou/atrasou só esta dupla */
  phaseOverride?: Phase | null;
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
  /** já participou do evento do museu */
  eventDone?: boolean;
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
  /** Só no confronto `coop` do Ep. 5: a Aliança inteira contra a máquina (SPEC-03 RN-C2). */
  coop?: CoopState | null;
  /** a Narradora já lançou os pontos de fim da Aliança (RN-C6, idempotente) */
  coopAwarded?: boolean;
};

/** A Aliança (Ep. 5): quem joga, quem já abriu o Cofre e os reforços mandados (quem → para quem). */
export type CoopState = {
  teams: string[];
  vaultSolvers: string[];
  reinforcements: Record<string, string>;
};

export type HelpRequestDoc = {
  teamId: string;
  challengeKey: string;
  createdAt: Timestamp | null;
  status: 'open' | 'done';
};

export type FeedDoc = {
  teamId: string;
  type: string;
  payload: { text: string };
  at: Timestamp | null;
};

/**
 * TODOS os números de regra do jogo ficam aqui (RNF-07).
 * Itens [PADRÃO] são decisões que a May pode mudar a qualquer momento.
 * Nunca hardcodar estes valores em componentes ou no motor.
 */

import type { Level } from '../types/domain.js';

export const GAME_RULES = {
  /** RN-02 [PADRÃO] */
  maxTeamsPerClass: 10,

  session: {
    /** RN-04: a sessão expira 3 h após criada. */
    expiresAfterHours: 3,
    /** RN-03: tamanho do código e alfabeto (sem 0/O/1/I). */
    codeLength: 4,
    codeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  },

  /** Seção 7.3 [PADRÃO]: tempos GUIA em minutos. Nada avança sozinho (RN-05). */
  phaseGuideMinutes: {
    lobby: 0,
    planning: 5,
    locks: 20,
    vault: 12,
    end: 10,
  },

  /** Etapa 8 (SPEC 14): a aula inteira cabe neste tempo, contando a entrada das duplas. */
  lesson: {
    totalMinutes: 50,
    /** chegada, código e login das duplas (o lobby não tem tempo guia) */
    entryMinutes: 3,
  },

  bar: {
    min: -100,
    max: 100,
    start: 0,
    /** RN-17 [PADRÃO]: trava antes do Cofre. */
    preVaultLimit: 60,
  },

  /**
   * RN-16 [PADRÃO]: forças de puxão.
   * Decisão da May (10/11): cadeado subiu de 15 para 20, para que a trava de ±60
   * realmente faça diferença (3 × 20 + 10 = 70 > 60).
   */
  pull: {
    lockOpen: 20,
    museumEventOk: 10,
    /**
     * Combo (pedido da May, 16/11): abrir o cadeado de primeira, sem erro e sem dica, puxa
     * este tanto A MAIS. Recompensa quem "bate a cabeça" sem pedir ajuda.
     */
    comboBonus: 5,
  },

  /** Seção 7.6: pontuação da temporada. */
  points: {
    lockOpen: 1, // [PADRÃO]
    lockFirstInClass: 3,
    museumEventOk: 1, // [PADRÃO]
    vaultWin: 5,
    draw: 2,
    sideBonus: 2,
    wrongAnswer: -2,
    /** Dicas no nível A (o B e o C pagam mais, ver `hintsByLevel`). */
    hint1: -2,
    hint2: -4,
    /** Pedido da May (16/11): dica mais cara nos níveis B e C, para valer a pena pensar antes. */
    hintsByLevel: {
      A: { hint1: -2, hint2: -4 },
      B: { hint1: -3, hint2: -5 },
      C: { hint1: -3, hint2: -5 },
    } satisfies Record<Level, { hint1: number; hint2: number }>,
    /** Cofre Relâmpago (16/11): resolver o Cofre dentro do tempo relâmpago. */
    vaultFast: 2,
    /** Missão bônus (16/11): o enigma extra de quem já abriu o Cofre. */
    bonusMission: 2,
    /** RN-22: o total nunca fica abaixo disto. */
    minTotal: 0,
  },

  /**
   * Cofre Relâmpago (pedido da May, 16/11) [PADRÃO]: quem resolve o Cofre em até N minutos depois
   * de a Narradora liberar ganha `points.vaultFast`. O robô leva de 3,5 a 7 min, então dá para
   * bater (C é mais apertado).
   */
  vaultLightningMinutes: { A: 7, B: 6, C: 5 } satisfies Record<Level, number>,

  /**
   * Cartas do Álbum (pedido da May, 16/11) [PADRÃO]: a dupla equipa UMA carta de outro episódio
   * no planejamento e usa o poder durante o jogo. A dourada (venceu o confronto) é rara: vale
   * mais usos por episódio.
   */
  cards: {
    usesPerEpisode: { normal: 1, dourada: 2 },
    /** Bombe Turbinada: força extra no próximo cadeado aberto */
    extraPull: 10,
    /** Contagem Regressiva: minutos a mais no Cofre Relâmpago */
    lightningPlusMinutes: 2,
  },

  /** RN-12.4 [PADRÃO]: diferença mínima de duplas para o bônus de lado vazio. */
  sideBonusMinDifference: 2,

  answers: {
    /** RN-31 [PADRÃO]: bloqueio do botão de enviar após erro (ms). */
    wrongAnswerCooldownMs: 3000,
    /** RN-30: "Chamar o Professor" por episódio. */
    helpRequestsPerEpisode: 1,
  },

  museumEvent: {
    /** RN-32 [PADRÃO]: janela do disparo automático, em minutos após o início de `locks`. */
    autoTriggerMinMinutes: 8,
    autoTriggerMaxMinutes: 12,
    /** RN-35: tempo de prisão (s). */
    jailSeconds: 60,
    /** RN-36 [PADRÃO]: chance de a máquina acertar o evento. */
    machineSuccessChance: 0.8,
    /**
     * SPEC-02 A1: todo cliente conectado (duplas, painel, projetor) confere a cada N s se já é
     * hora do evento automático; o primeiro que vencer a transação dispara.
     */
    electionCheckSeconds: 5,
  },

  abilities: {
    /** RN-37: a cada N desafios resolvidos, ganha uma habilidade. */
    solvedPerAbility: 2,
    /** RN-38: com a barra a favor do rival, ganha a cada N desafios. */
    solvedPerAbilityWhenLosing: 1,
    /** Seção 7.9: durações e efeitos. */
    interferenceFreezeSeconds: 10,
    anchorDurationSeconds: 30,
    anchorMultiplier: 0.5,
    disguiseDurationSeconds: 30,
    /** RN-41 [PADRÃO]: chance de a máquina usar uma habilidade após resolver um desafio. */
    machineUseChance: 0.3,
  },

  match: {
    /** quantos eventos o `log` do confronto guarda (SPEC 6.1) */
    logSize: 30,
  },

  /** RN-42 [PADRÃO]: tempo (s) que a máquina leva por desafio, por nível. */
  machineSolveSeconds: {
    A: { lock: [150, 210], vault: [300, 420] },
    B: { lock: [120, 180], vault: [240, 360] },
    C: { lock: [90, 150], vault: [200, 300] },
  } satisfies Record<Level, { lock: [number, number]; vault: [number, number] }>,

  team: {
    pinLength: 4,
    /** RN-52: erros seguidos de PIN antes do bloqueio. */
    maxPinAttempts: 5,
    pinLockSeconds: 60,
  },

  /**
   * Limite do /api/join-session (seção 8.1, ajustado com a May em 10/11).
   * Escolas costumam sair todas pelo MESMO IP, então limitar acessos válidos travaria a turma.
   * Só tentativas com código INVÁLIDO contam, por IP.
   */
  joinRateLimit: {
    windowSeconds: 60,
    maxInvalidCodesPerIp: 30,
  },

  audio: {
    /** Seção 10 [PADRÃO] */
    defaultMusicVolume: 0.3,
    defaultSfxVolume: 0.7,
  },

  /** SPEC-02 A3 [PADRÃO]: a limpeza apaga sessões que venceram há mais de N dias. */
  cleanup: {
    olderThanDays: 30,
  },

  presence: {
    /** A dupla avisa que está conectada a cada N segundos (painel mostra "desconectada"). */
    heartbeatSeconds: 30,
  },

  ui: {
    /** RN-10: troca a curiosidade da tela de espera a cada N segundos. */
    curiosityRotateSeconds: 9,
    /** Seção 9.6: corpo mínimo do texto (px) por nível. */
    minBodyFontPx: { A: 18, B: 16, C: 16 } satisfies Record<Level, number>,
    minButtonHeightPx: 44,
  },
} as const;

/** Deriva o nível a partir da série (RN-01). */
export function levelFromGrade(grade: number): Level {
  if (grade <= 5) return 'A';
  if (grade <= 7) return 'B';
  return 'C';
}

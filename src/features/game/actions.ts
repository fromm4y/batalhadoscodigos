/**
 * Ações da dupla que gravam no Firestore (sempre em transação):
 * pontos + ledger + total (RN-22, RN-24), dicas (RN-29), progresso dos cadeados (RN-27) e Cofre.
 */
import {
  addDoc,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';
import { GAME_RULES } from '@/config/gameRules';
import {
  abilityEffect,
  applyPull,
  barFavorsRival,
  earnsAbility,
  machineDelayFromEffect,
  machineMatchId,
  other,
  pickAbility,
  pushLog,
  winningBar,
  ABILITY_INFO,
} from '@/engine/match';
import {
  applyDelta,
  hintCost,
  isCombo,
  isLightningVault,
  lockPull,
  POINTS,
} from '@/engine/scoring';
import { cardEffect, cardUsesLeft } from '@/engine/cards';
import {
  canReinforce,
  classWins,
  COOP_CLASS_SIDE,
  COOP_MATCH_ID,
  coopPull,
  newCoopState,
  reinforceTargets,
  vaultGoal,
} from '@/engine/coop';
import type { CardPowerId } from '@/content/types';
import { getFirebase } from '@/lib/firebase';
import { serverNow } from '@/lib/serverClock';
import type {
  AbilityId,
  GameMode,
  LedgerReason,
  Level,
  MatchDoc,
  PlayerDoc,
  Side,
  TeamDoc,
} from '@/types/domain';

export type GameCtx = { sessionId: string; classId: string; teamId: string; episodeId: string };

const refs = (db: Firestore, c: GameCtx) => ({
  team: doc(db, 'classes', c.classId, 'teams', c.teamId),
  player: doc(db, 'sessions', c.sessionId, 'players', c.teamId),
  ledger: collection(db, 'classes', c.classId, 'teams', c.teamId, 'ledger'),
});

const matchRef = (db: Firestore, c: GameCtx, matchId: string) =>
  doc(db, 'sessions', c.sessionId, 'matches', matchId);

/** Rótulo curto da dupla para o log do confronto. */
const who = (side: Side) => (side === 'red' ? 'Bando' : 'Piratas');
/** Ep. 5 (coop): quem puxa é "uma dupla da Aliança" ou a máquina. */
const whoIn = (m: MatchDoc, side: Side) =>
  m.coop ? (side === COOP_CLASS_SIDE ? 'Uma dupla da Aliança' : 'A máquina') : who(side);
/** RN-C3: no coop, a força do puxão é dividida pelo tamanho da Aliança. */
const forceIn = (m: MatchDoc, force: number) =>
  m.coop ? coopPull(force, m.coop.teams.length) : force;

type PointsChange = { reason: Exclude<LedgerReason, 'manual'>; delta: number };

/**
 * Aplica vários lançamentos numa transação já aberta (depois das leituras).
 * O ledger guarda o valor que REALMENTE entrou (com a trava do zero), então a soma do ledger
 * sempre bate com o total.
 */
function writePoints(
  tx: Transaction,
  db: Firestore,
  c: GameCtx,
  team: TeamDoc,
  player: PlayerDoc,
  changes: PointsChange[],
  extraPlayer: Record<string, unknown> = {},
) {
  const r = refs(db, c);
  let total = team.totalPoints;
  let episode = player.episodePoints;
  for (const ch of changes) {
    const next = applyDelta(total, ch.delta);
    const effective = next - total;
    total = next;
    episode += effective;
    if (effective !== 0) {
      tx.set(doc(r.ledger), {
        sessionId: c.sessionId,
        episodeId: c.episodeId,
        delta: effective,
        reason: ch.reason,
        at: serverTimestamp(),
        by: 'game',
      });
    }
  }
  if (total !== team.totalPoints) tx.update(r.team, { totalPoints: total });
  tx.update(r.player, { episodePoints: episode, ...extraPlayer });
}

async function readBoth(tx: Transaction, db: Firestore, c: GameCtx) {
  const r = refs(db, c);
  const [t, p] = await Promise.all([tx.get(r.team), tx.get(r.player)]);
  if (!t.exists() || !p.exists()) throw new Error('Dupla ou sessão não encontrada.');
  return { team: t.data() as TeamDoc, player: p.data() as PlayerDoc };
}

/**
 * Resposta errada: −2 (7.6) e conta o erro no desafio (o combo só vale sem erro).
 * Na missão bônus (`free`), errar não custa ponto.
 */
export async function registerWrongAnswer(
  c: GameCtx,
  challengeKey: string,
  free = false,
): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    // carta Válvula Reserva: o próximo erro não tira ponto
    const forgiven = !free && player.cardBoost === 'forgiveMiss';
    writePoints(
      tx,
      db,
      c,
      team,
      player,
      free || forgiven ? [] : [{ reason: 'wrong_answer', delta: POINTS.wrong_answer }],
      {
        [`misses.${challengeKey}`]: (player.misses?.[challengeKey] ?? 0) + 1,
        ...(forgiven ? { cardBoost: null } : {}),
      },
    );
  });
}

/** Compra a dica `tier` do desafio (a Dica 2 só depois da 1). `free` = dica grátis. */
export async function buyHint(
  c: GameCtx,
  challengeKey: string,
  tier: 1 | 2,
  free = false,
  level: Level = 'A',
): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const used = player.hints?.[challengeKey] ?? 0;
    if (used >= tier) return; // já comprada (clique duplo)
    if (tier === 2 && used < 1) throw new Error('A Dica 2 só abre depois da Dica 1.');
    const cost = hintCost(tier, free, level);
    writePoints(
      tx,
      db,
      c,
      team,
      player,
      cost ? [{ reason: tier === 1 ? 'hint_1' : 'hint_2', delta: cost }] : [],
      {
        [`hints.${challengeKey}`]: tier,
      },
    );
  });
}

/**
 * Abre o cadeado `index` (0–2): +1, e +3 se for a primeira dupla da turma a abrir esse
 * número (independe do lado). Na mesma transação: puxão no cabo de guerra (RN-21, com o bônus
 * de combo se abriu de primeira sem dica) e, se for a vez, uma habilidade nova (RN-37/38).
 */
export async function openLock(
  c: GameCtx,
  index: 0 | 1 | 2,
  /** chaves das etapas do cadeado: o combo exige todas sem erro e sem dica */
  keys: string[],
): Promise<{ first: boolean; ability: AbilityId | null; blocked: boolean; combo: boolean }> {
  const { db } = getFirebase('student');
  const firstRef = doc(db, 'sessions', c.sessionId, 'firsts', `lock${index + 1}`);
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const firstSnap = await tx.get(firstRef);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    if (player.progress.lockIndex !== index)
      return { first: false, ability: null, blocked: false, combo: false };
    const combo = keys.every((k) => isCombo(player.hints?.[k], player.misses?.[k]));

    const first = !firstSnap.exists();
    if (first) tx.set(firstRef, { teamId: c.teamId, at: serverTimestamp() });
    const openedAt = [...player.progress.locksOpenedAt];
    openedAt[index] = Timestamp.now(); // serverTimestamp não é aceito dentro de listas
    const changes: PointsChange[] = [{ reason: 'lock_open', delta: POINTS.lock_open }];
    if (first) changes.push({ reason: 'lock_first', delta: POINTS.lock_first });

    const side = player.side ?? 'red';
    let bar = 0;
    let blocked = false;
    if (mRef && mSnap?.exists()) {
      const m = mSnap.data() as MatchDoc;
      if (!m.winner) {
        const now = serverNow();
        const boost = player.cardBoost === 'extraPull' ? GAME_RULES.cards.extraPull : 0;
        const r = applyPull(m, side, forceIn(m, lockPull(combo) + boost), now);
        bar = r.bar;
        blocked = r.blocked;
        tx.update(mRef, {
          bar: r.bar,
          effects: r.effects,
          log: pushLog(m.log, {
            at: now,
            side,
            type: r.blocked ? 'blocked' : 'pull',
            text: r.blocked
              ? `${whoIn(m, side)} abriu o cadeado ${index + 1}, mas o Escudo segurou a corda!`
              : `${whoIn(m, side)} abriu o cadeado ${index + 1} e puxou ${r.applied}${combo ? ' (COMBO!)' : ''}!`,
          }),
        });
      } else bar = m.bar;
    }

    const solved = player.solvedCount + 1;
    const owned = player.abilities?.owned ?? [];
    const ability = earnsAbility(solved, barFavorsRival(bar, side))
      ? pickAbility(side, owned)
      : null;
    writePoints(tx, db, c, team, player, changes, {
      ...(player.cardBoost === 'extraPull' ? { cardBoost: null } : {}),
      'progress.lockIndex': index + 1,
      'progress.step': 0,
      'progress.locksOpenedAt': openedAt,
      solvedCount: solved,
      ...(ability ? { 'abilities.owned': [...owned, ability] } : {}),
    });
    return { first, ability, blocked, combo };
  });
}

/**
 * Resolve o Cofre. O primeiro lado a resolver vence o confronto (RN-19): barra vai a ±100 e
 * a dupla vencedora ganha +5 na mesma transação. Dentro do tempo relâmpago (16/11), +2 para
 * quem resolveu, vencendo ou não. `phaseStartMs` = null quando não vale o relâmpago
 * (ex.: fase adiantada só para esta dupla).
 */
export async function solveVault(
  c: GameCtx,
  lightning: { level: Level; phaseStartMs: number } | null,
): Promise<{ won: boolean; fast: boolean }> {
  const { db } = getFirebase('student');
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    const side = player.side ?? 'red';
    const extra = { 'progress.vaultSolvedAt': serverTimestamp(), finishedAt: serverTimestamp() };
    if (player.progress.vaultSolvedAt) return { won: false, fast: false };
    const fast =
      !!lightning &&
      isLightningVault(
        lightning.level,
        lightning.phaseStartMs,
        serverNow(),
        player.cardBoost === 'lightningPlus' ? GAME_RULES.cards.lightningPlusMinutes : 0,
      );
    const fastPts: PointsChange[] = fast
      ? [{ reason: 'vault_fast', delta: POINTS.vault_fast }]
      : [];
    if (!mRef || !mSnap?.exists() || (mSnap.data() as MatchDoc).winner) {
      writePoints(tx, db, c, team, player, fastPts, extra);
      return { won: false, fast };
    }
    const m = mSnap.data() as MatchDoc;
    const now = serverNow();
    if (m.coop) {
      // RN-C5/C6: o Cofre conta para a turma; os +5 (ou +2) de todas vêm no fim, pela Narradora
      const coop = {
        ...m.coop,
        vaultSolvers: [...new Set([...m.coop.vaultSolvers, c.teamId])],
      };
      const won = classWins(coop);
      tx.update(mRef, {
        coop,
        ...(won
          ? {
              winner: COOP_CLASS_SIDE,
              bar: winningBar(COOP_CLASS_SIDE),
              resolvedAt: serverTimestamp(),
            }
          : {}),
        log: pushLog(m.log, {
          at: now,
          side,
          type: 'vault',
          text: won
            ? 'A Aliança abriu o Grande Cofre antes da máquina! BOOM!'
            : `Mais uma dupla abriu o Cofre: ${coop.vaultSolvers.length} de ${vaultGoal(coop.teams.length)}!`,
        }),
      });
      writePoints(tx, db, c, team, player, fastPts, extra);
      return { won, fast };
    }
    tx.update(mRef, {
      winner: side,
      bar: winningBar(side),
      resolvedAt: serverTimestamp(),
      log: pushLog(m.log, {
        at: now,
        side,
        type: 'vault',
        text: `${who(side)} abriu o Cofre primeiro! BOOM!`,
      }),
    });
    writePoints(
      tx,
      db,
      c,
      team,
      player,
      [{ reason: 'vault_win', delta: POINTS.vault_win }, ...fastPts],
      extra,
    );
    return { won: true, fast };
  });
}

/**
 * Etapa 1 de um cadeado ou do Cofre concluída (pedido da May, 17/11): meio puxão na corda e a
 * dupla passa para a etapa 2. Sem pontos (o ponto vem ao abrir o cadeado).
 */
export async function finishStageOne(
  c: GameCtx,
  slot: 0 | 1 | 2 | 'vault',
): Promise<{ blocked: boolean }> {
  const { db } = getFirebase('student');
  return runTransaction(db, async (tx) => {
    const { player } = await readBoth(tx, db, c);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    const field = slot === 'vault' ? 'progress.vaultStep' : 'progress.step';
    const current = slot === 'vault' ? player.progress.vaultStep : player.progress.step;
    if (current === 1 || (slot !== 'vault' && player.progress.lockIndex !== slot))
      return { blocked: false };
    const side = player.side ?? 'red';
    let blocked = false;
    if (mRef && mSnap?.exists()) {
      const m = mSnap.data() as MatchDoc;
      if (!m.winner) {
        const now = serverNow();
        const r = applyPull(m, side, forceIn(m, GAME_RULES.pull.stageOne), now);
        blocked = r.blocked;
        const what = slot === 'vault' ? 'o Cofre' : `o cadeado ${slot + 1}`;
        tx.update(mRef, {
          bar: r.bar,
          effects: r.effects,
          log: pushLog(m.log, {
            at: now,
            side,
            type: r.blocked ? 'blocked' : 'pull',
            text: r.blocked
              ? `${whoIn(m, side)} passou da metade de ${what}, mas o Escudo segurou a corda!`
              : `${whoIn(m, side)} passou da metade de ${what} e puxou ${r.applied}!`,
          }),
        });
      }
    }
    tx.update(refs(db, c).player, { [field]: 1 });
    return { blocked };
  });
}

/** Missão bônus (16/11): só depois do Cofre, uma vez por episódio. */
export async function solveBonus(c: GameCtx): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    if (!player.progress.vaultSolvedAt || player.bonusSolvedAt) return;
    writePoints(
      tx,
      db,
      c,
      team,
      player,
      [{ reason: 'bonus_mission', delta: POINTS.bonus_mission }],
      { bonusSolvedAt: serverTimestamp() },
    );
  });
}

/**
 * Usa uma habilidade (uma vez por episódio, RN-39). Efeitos de atrapalhar/proteger vão para o
 * confronto; contra a máquina, a Interferência atrasa o robô (RN-40). Plano B/Bússola: Dica 1 grátis.
 */
export async function activateAbility(
  c: GameCtx,
  id: AbilityId,
  challengeKey: string | null,
): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    const owned = player.abilities?.owned ?? [];
    const used = player.abilities?.used ?? [];
    if (!owned.includes(id) || used.includes(id)) return;
    const side = player.side ?? 'red';
    const now = serverNow();
    const outcome = abilityEffect(id, side, now);
    const extra: Record<string, unknown> = { 'abilities.used': [...used, id] };

    if (outcome.kind === 'freeHint') {
      if (!challengeKey) throw new Error('Use a dica dentro de um desafio.');
      if ((player.hints?.[challengeKey] ?? 0) < 1) extra[`hints.${challengeKey}`] = 1;
    } else if (mRef && mSnap?.exists()) {
      const m = mSnap.data() as MatchDoc;
      const patch: Record<string, unknown> = {
        log: pushLog(m.log, {
          at: now,
          side,
          type: 'ability',
          text: `${whoIn(m, side)} usou ${ABILITY_INFO[id].name}!`,
        }),
      };
      if (m.machineSide && m.machine) {
        // Contra a máquina: Âncora/Escudo/Disfarce valem como efeito; Interferência atrasa o robô.
        // coop (RN-C3): como o puxão, o atraso é dividido pelo tamanho da Aliança
        const delay = Math.round(
          machineDelayFromEffect(outcome.effect) / (m.coop ? Math.max(1, m.coop.teams.length) : 1),
        );
        if (delay && m.machine.nextAt) patch['machine.nextAt'] = m.machine.nextAt + delay;
        if (!delay) patch.effects = [...m.effects, outcome.effect];
      } else {
        patch.effects = [...m.effects, outcome.effect];
      }
      tx.update(mRef, patch);
    }
    writePoints(tx, db, c, team, player, [], extra);
  });
}

/** Escolha do modo (RN-11): contra pessoas ou contra a máquina. */
export async function chooseMode(c: GameCtx, mode: GameMode): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, { mode });
}

/**
 * Dupla que chegou depois da formação (RN-07): cria o próprio confronto contra a máquina.
 */
export async function joinLateAgainstMachine(c: GameCtx, side: Side): Promise<void> {
  const { db } = getFirebase('student');
  const id = machineMatchId(c.teamId);
  await runTransaction(db, async (tx) => {
    const p = await tx.get(refs(db, c).player);
    if ((p.data() as PlayerDoc | undefined)?.matchId) return;
    tx.set(
      matchRef(db, c, id),
      newMatchDoc(side === 'red' ? c.teamId : null, side === 'blue' ? c.teamId : null, other(side)),
    );
    tx.update(refs(db, c).player, { matchId: id, side, mode: 'maquina' });
  });
}

/** Documento inicial de um confronto (SPEC 6.1). */
export function newMatchDoc(
  red: string | null,
  blue: string | null,
  machineSide: Side | null,
): MatchDoc {
  return {
    redTeamId: red,
    blueTeamId: blue,
    machineSide,
    bar: GAME_RULES.bar.start,
    effects: [],
    vaultLeader: null,
    winner: null,
    resolvedAt: null,
    log: [],
    machine: machineSide
      ? { lockIndex: 0, phase: null, nextAt: null, vaultSolved: false, usedAbilities: [] }
      : null,
  };
}

/** Escolha de lado na fase de planejamento (RN-11). */
/**
 * Ep. 5 (RN-C1): a dupla entra na Aliança. Se a Narradora já formou a Aliança, entra no
 * confronto `coop` (dupla atrasada); se não, só marca o modo e espera a formação.
 */
export async function joinAlliance(c: GameCtx): Promise<void> {
  const { db } = getFirebase('student');
  const mRef = matchRef(db, c, COOP_MATCH_ID);
  await runTransaction(db, async (tx) => {
    const p = (await tx.get(refs(db, c).player)).data() as PlayerDoc | undefined;
    const mSnap = await tx.get(mRef);
    if (!p || p.matchId) return;
    if (!mSnap.exists()) {
      tx.update(refs(db, c).player, { side: COOP_CLASS_SIDE, mode: 'coop' });
      return;
    }
    const m = mSnap.data() as MatchDoc;
    const coop = m.coop ?? newCoopState();
    tx.update(mRef, { coop: { ...coop, teams: [...new Set([...coop.teams, c.teamId])] } });
    tx.update(refs(db, c).player, {
      side: COOP_CLASS_SIDE,
      mode: 'coop',
      matchId: COOP_MATCH_ID,
    });
  });
}

/** RN-C7: quem abriu o Cofre manda UM reforço (Dica 1 grátis) para uma dupla que não terminou. */
export async function sendReinforcement(c: GameCtx, to: string): Promise<boolean> {
  const { db } = getFirebase('student');
  const mRef = matchRef(db, c, COOP_MATCH_ID);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(mRef);
    const m = snap.data() as MatchDoc | undefined;
    if (!m?.coop || !canReinforce(m.coop, c.teamId) || !reinforceTargets(m.coop).includes(to))
      return false;
    tx.update(mRef, {
      coop: { ...m.coop, reinforcements: { ...m.coop.reinforcements, [c.teamId]: to } },
      log: pushLog(m.log, {
        at: serverNow(),
        side: COOP_CLASS_SIDE,
        type: 'reinforce',
        text: 'Reforço a caminho! Uma dupla mandou uma dica para outra. 🤝',
      }),
    });
    return true;
  });
}

/** A dupla que recebeu o reforço ganha a Dica 1 (sem custo) no desafio em que está. */
export async function applyReinforcement(c: GameCtx, from: string, key: string): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const p = (await tx.get(refs(db, c).player)).data() as PlayerDoc | undefined;
    if (!p || p.reinforcedBy) return;
    const have = p.hints?.[key] ?? 0;
    tx.update(refs(db, c).player, {
      reinforcedBy: from,
      hints: { ...p.hints, [key]: Math.max(have, 1) as 0 | 1 | 2 },
    });
  });
}

export async function chooseSide(c: GameCtx, side: Side): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, { side });
}

/** A dupla ouviu a transmissão da Narradora (RN-45): libera o passo que dependia dela. */
export async function markHeardTransmission(c: GameCtx): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, {
    'progress.heardTransmission': true,
  });
}

/** Linha do tempo do painel (SPEC 9.3). Melhor esforço: nunca atrapalha o jogo. */
export function addFeed(c: GameCtx, type: string, text: string): void {
  void addDoc(collection(getFirebase('student').db, 'sessions', c.sessionId, 'feed'), {
    teamId: c.teamId,
    type,
    payload: { text },
    at: serverTimestamp(),
  }).catch(() => undefined);
}

/**
 * Fim do evento do museu para a dupla (RN-35): acertou os 3 → +1 ponto, puxão de 10 e conta
 * como desafio resolvido (habilidades); errou → presa até `jailUntilMs`.
 */
export async function finishMuseumEvent(
  c: GameCtx,
  success: boolean,
  jailUntilMs: number,
): Promise<{ ability: AbilityId | null }> {
  const { db } = getFirebase('student');
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    if (player.progress.eventResult !== 'pending') return { ability: null };
    if (!success) {
      writePoints(tx, db, c, team, player, [], {
        'progress.eventResult': 'failed',
        'progress.jailUntil': Timestamp.fromMillis(jailUntilMs),
      });
      return { ability: null };
    }
    const side = player.side ?? 'red';
    let bar = 0;
    if (mRef && mSnap?.exists()) {
      const m = mSnap.data() as MatchDoc;
      bar = m.bar;
      if (!m.winner) {
        const now = serverNow();
        const r = applyPull(m, side, forceIn(m, GAME_RULES.pull.museumEventOk), now);
        bar = r.bar;
        tx.update(mRef, {
          bar: r.bar,
          effects: r.effects,
          log: pushLog(m.log, {
            at: now,
            side,
            type: r.blocked ? 'blocked' : 'pull',
            text: `${whoIn(m, side)} desvendou o alarme e puxou ${r.applied}!`,
          }),
        });
      }
    }
    const solved = player.solvedCount + 1;
    const owned = player.abilities?.owned ?? [];
    const ability = earnsAbility(solved, barFavorsRival(bar, side))
      ? pickAbility(side, owned)
      : null;
    writePoints(tx, db, c, team, player, [{ reason: 'event_ok', delta: POINTS.event_ok }], {
      'progress.eventResult': 'ok',
      solvedCount: solved,
      ...(ability ? { 'abilities.owned': [...owned, ability] } : {}),
    });
    return { ability };
  });
}

/** "Chamar o Professor" (RN-30): uma vez por episódio, sem custo. */
export async function callHelp(c: GameCtx, challengeKey: string): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { player } = await readBoth(tx, db, c);
    if (player.helpUsed) return;
    tx.set(doc(collection(db, 'sessions', c.sessionId, 'helpRequests')), {
      teamId: c.teamId,
      challengeKey,
      createdAt: serverTimestamp(),
      status: 'open',
    });
    tx.update(refs(db, c).player, { helpUsed: true });
  });
}

/** Equipa uma carta do Álbum para este episódio (no planejamento). `null` = sem carta. */
export async function equipCard(c: GameCtx, episodeId: string | null): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, {
    equippedCard: episodeId,
    cardUses: 0,
    cardBoost: null,
  });
}

/**
 * Usa o poder da carta equipada (pedido da May, 16/11). Dicas abrem na hora, sem custo; os
 * outros poderes ficam guardados até o momento certo (`cardBoost`).
 */
export async function activateCard(
  c: GameCtx,
  power: CardPowerId,
  challengeKey: string | null,
): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const card = team.cards?.find((x) => x.episodeId === player.equippedCard);
    if (!card || cardUsesLeft(card, player.cardUses) <= 0) return;
    const effect = cardEffect(power);
    const patch: Record<string, unknown> = { cardUses: (player.cardUses ?? 0) + 1 };
    if (effect.kind === 'hints') {
      if (!challengeKey) throw new Error('Usem esta carta dentro de um desafio.');
      const used = player.hints?.[challengeKey] ?? 0;
      if (used >= effect.tier) return;
      patch[`hints.${challengeKey}`] = effect.tier;
    } else {
      if (player.cardBoost) return; // um poder guardado por vez
      patch.cardBoost = effect.boost;
    }
    tx.update(refs(db, c).player, patch);
  });
}

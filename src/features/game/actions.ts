/**
 * Ações da dupla que gravam no Firestore (sempre em transação):
 * pontos + ledger + total (RN-22, RN-24), dicas (RN-29), progresso dos cadeados (RN-27) e Cofre.
 */
import {
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
import { applyDelta, hintCost, POINTS } from '@/engine/scoring';
import { getFirebase } from '@/lib/firebase';
import { serverNow } from '@/lib/serverClock';
import type {
  AbilityId,
  GameMode,
  LedgerReason,
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

/** Resposta errada: −2 (7.6). */
export async function registerWrongAnswer(c: GameCtx): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    writePoints(tx, db, c, team, player, [{ reason: 'wrong_answer', delta: POINTS.wrong_answer }]);
  });
}

/** Compra a dica `tier` do desafio (a Dica 2 só depois da 1). `free` = dica grátis. */
export async function buyHint(
  c: GameCtx,
  challengeKey: string,
  tier: 1 | 2,
  free = false,
): Promise<void> {
  const { db } = getFirebase('student');
  await runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const used = player.hints?.[challengeKey] ?? 0;
    if (used >= tier) return; // já comprada (clique duplo)
    if (tier === 2 && used < 1) throw new Error('A Dica 2 só abre depois da Dica 1.');
    const cost = hintCost(tier, free);
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
 * número (independe do lado). Na mesma transação: puxão no cabo de guerra (RN-21) e,
 * se for a vez, uma habilidade nova (RN-37/38).
 */
export async function openLock(
  c: GameCtx,
  index: 0 | 1 | 2,
): Promise<{ first: boolean; ability: AbilityId | null; blocked: boolean }> {
  const { db } = getFirebase('student');
  const firstRef = doc(db, 'sessions', c.sessionId, 'firsts', `lock${index + 1}`);
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const firstSnap = await tx.get(firstRef);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    if (player.progress.lockIndex !== index) return { first: false, ability: null, blocked: false };

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
        const r = applyPull(m, side, GAME_RULES.pull.lockOpen, now);
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
              ? `${who(side)} abriu o cadeado ${index + 1}, mas o Escudo segurou a corda!`
              : `${who(side)} abriu o cadeado ${index + 1} e puxou ${r.applied}!`,
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
      'progress.lockIndex': index + 1,
      'progress.locksOpenedAt': openedAt,
      solvedCount: solved,
      ...(ability ? { 'abilities.owned': [...owned, ability] } : {}),
    });
    return { first, ability, blocked };
  });
}

/**
 * Resolve o Cofre. O primeiro lado a resolver vence o confronto (RN-19): barra vai a ±100 e
 * a dupla vencedora ganha +5 na mesma transação.
 */
export async function solveVault(c: GameCtx): Promise<{ won: boolean }> {
  const { db } = getFirebase('student');
  return runTransaction(db, async (tx) => {
    const { team, player } = await readBoth(tx, db, c);
    const mRef = player.matchId ? matchRef(db, c, player.matchId) : null;
    const mSnap = mRef ? await tx.get(mRef) : null;
    const side = player.side ?? 'red';
    const extra = { 'progress.vaultSolvedAt': serverTimestamp(), finishedAt: serverTimestamp() };
    if (player.progress.vaultSolvedAt) return { won: false };
    if (!mRef || !mSnap?.exists() || (mSnap.data() as MatchDoc).winner) {
      writePoints(tx, db, c, team, player, [], extra);
      return { won: false };
    }
    const m = mSnap.data() as MatchDoc;
    const now = serverNow();
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
    writePoints(tx, db, c, team, player, [{ reason: 'vault_win', delta: POINTS.vault_win }], extra);
    return { won: true };
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
          text: `${who(side)} usou ${ABILITY_INFO[id].name}!`,
        }),
      };
      if (m.machineSide && m.machine) {
        // Contra a máquina: Âncora/Escudo/Disfarce valem como efeito; Interferência atrasa o robô.
        const delay = machineDelayFromEffect(outcome.effect);
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
export async function chooseSide(c: GameCtx, side: Side): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, { side });
}

/** A dupla ouviu a transmissão da Narradora (RN-45): libera o passo que dependia dela. */
export async function markHeardTransmission(c: GameCtx): Promise<void> {
  await updateDoc(refs(getFirebase('student').db, c).player, {
    'progress.heardTransmission': true,
  });
}

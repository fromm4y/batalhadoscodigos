/**
 * O Robô (RN-42 a RN-44): roda no navegador da dupla que joga contra ele e grava os passos
 * no documento do confronto (SPEC 5.2). Nunca erra cadeados (RN-43).
 */
import { doc, runTransaction } from 'firebase/firestore';
import { GAME_RULES } from '@/config/gameRules';
import { pickTaunt } from '@/content/robot';
import { abilityEffect, applyPull, machineDelayMs, pushLog, winningBar } from '@/engine/match';
import { getFirebase } from '@/lib/firebase';
import { serverNow } from '@/lib/serverClock';
import type { AbilityId, Level, MatchDoc, Phase, Side } from '@/types/domain';

/** Só nos testes locais (emulador): acelera o robô. Nunca vale em produção. */
function speedFactor(): number {
  if (import.meta.env.VITE_USE_EMULATORS !== 'true') return 1;
  try {
    return Number(localStorage.getItem('cacada.machineSpeed')) || 1;
  } catch {
    return 1;
  }
}

/** Habilidades que o robô usa contra a dupla (atrapalhar/proteger do lado dele). */
const MACHINE_ABILITIES: Record<Side, AbilityId[]> = {
  red: ['interferencia', 'disfarce'],
  blue: ['ancora', 'escudo'],
};

export type MachineEnv = {
  /** evento do museu acontecendo agora (RN-36) */
  eventRunning: boolean;
  /** telas congeladas pela Narradora (RN-46): o robô também espera */
  frozen: boolean;
};

/** Um "tique" do robô: decide e grava o próximo passo, se for a hora. */
export async function machineTick(
  sessionId: string,
  matchId: string,
  level: Level,
  phase: Phase,
  env: MachineEnv = { eventRunning: false, frozen: false },
): Promise<void> {
  if (env.frozen) return;
  if (phase !== 'locks' && phase !== 'vault') return;
  const { db } = getFirebase('student');
  const ref = doc(db, 'sessions', sessionId, 'matches', matchId);
  const speed = speedFactor();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const m = snap.data() as MatchDoc;
    const side = m.machineSide;
    const st = m.machine;
    if (!side || !st || m.winner) return;
    const now = serverNow();
    const delay = (slot: 'lock' | 'vault') => Math.round(machineDelayMs(level, slot) / speed);

    // RN-36: no evento do museu, o robô acerta 80% das vezes (puxão de 10).
    if (env.eventRunning && !st.eventDone) {
      const okEvent = Math.random() < GAME_RULES.museumEvent.machineSuccessChance;
      const pull = okEvent ? applyPull(m, side, GAME_RULES.pull.museumEventOk, now) : null;
      tx.update(ref, {
        ...(pull ? { bar: pull.bar, effects: pull.effects } : {}),
        machine: { ...st, eventDone: true },
        log: pushLog(m.log, {
          at: now,
          side,
          type: okEvent ? 'pull' : 'event_fail',
          text: okEvent
            ? 'Alarme analisado. Bip! Acertei os 3.'
            : 'Erro de leitura no alarme... bzzt!',
        }),
      });
      return;
    }

    if (st.phase !== phase) {
      const nextAt =
        phase === 'locks' ? (st.lockIndex < 3 ? now + delay('lock') : null) : now + delay('vault');
      tx.update(ref, {
        machine: { ...st, phase, nextAt },
        log: pushLog(m.log, { at: now, side, type: 'taunt', text: pickTaunt('start') }),
      });
      return;
    }
    if (st.nextAt === null || now < st.nextAt) return;

    if (phase === 'locks' && st.lockIndex < 3) {
      const lockIndex = st.lockIndex + 1;
      const pull = applyPull(m, side, GAME_RULES.pull.lockOpen, now);
      let effects = pull.effects;
      const used = [...st.usedAbilities];
      let log = pushLog(m.log, {
        at: now,
        side,
        type: pull.blocked ? 'blocked' : 'pull',
        text: pickTaunt('lock'),
      });
      // RN-41: chance de usar uma habilidade depois de resolver um desafio.
      const left = MACHINE_ABILITIES[side].filter((a) => !used.includes(a));
      if (left.length && Math.random() < GAME_RULES.abilities.machineUseChance) {
        const id = left[Math.floor(Math.random() * left.length)]!;
        const out = abilityEffect(id, side, now);
        if (out.kind === 'effect') effects = [...effects, out.effect];
        used.push(id);
        log = pushLog(log, { at: now, side, type: 'ability', text: pickTaunt('ability') });
      }
      tx.update(ref, {
        bar: pull.bar,
        effects,
        log,
        machine: {
          ...st,
          lockIndex,
          usedAbilities: used,
          nextAt: lockIndex < 3 ? now + delay('lock') : null,
        },
      });
      return;
    }
    if (phase === 'vault' && !st.vaultSolved) {
      tx.update(ref, {
        winner: side,
        bar: winningBar(side),
        resolvedAt: new Date(now),
        machine: { ...st, vaultSolved: true, nextAt: null },
        log: pushLog(m.log, { at: now, side, type: 'vault', text: pickTaunt('vault') }),
      });
    }
  });
}

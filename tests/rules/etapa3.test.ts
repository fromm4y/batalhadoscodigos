/**
 * Regras do Firestore — Etapa 3 (pontos, ledger, progresso, bônus da 1ª dupla).
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

const asTeam = (teamId: string, sessionId = 's1') =>
  env
    .authenticatedContext(`team_${teamId}_${sessionId}`, {
      role: 'team',
      teamId,
      classId: 'turma',
      sessionId,
      firebase: { sign_in_provider: 'custom' },
    })
    .firestore() as unknown as Firestore;

const progress = (lockIndex: number) => ({
  lockIndex,
  locksOpenedAt: [null, null, null],
  vaultSolvedAt: null,
  eventResult: 'pending',
  jailUntil: null,
  heardTransmission: false,
});

const ledgerEntry = (over: Record<string, unknown> = {}) => ({
  sessionId: 's1',
  episodeId: 'ep1',
  delta: 1,
  reason: 'lock_open',
  at: serverTimestamp(),
  by: 'game',
  ...over,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cacada',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'classes', 'turma'), { instructorId: 'ana', archived: false });
    for (const t of ['t1', 't2']) {
      await setDoc(doc(db, 'classes', 'turma', 'teams', t), { cityName: t, totalPoints: 3 });
      await setDoc(doc(db, 'sessions', 's1', 'players', t), {
        teamId: t,
        connected: true,
        side: null,
        progress: progress(0),
        hints: {},
        solvedCount: 0,
        episodePoints: 0,
        finishedAt: null,
      });
    }
    await setDoc(doc(db, 'sessions', 's1'), {
      classId: 'turma',
      instructorId: 'ana',
      status: 'open',
      phase: 'locks',
      expiresAt: new Date(Date.now() + 3600_000),
    });
  });
});

describe('pontos e ledger', () => {
  it('a dupla lança pontos para si: ledger + total + episódio, na mesma transação', async () => {
    const db = asTeam('t1');
    await assertSucceeds(
      runTransaction(db, async (tx) => {
        await tx.get(doc(db, 'classes', 'turma', 'teams', 't1'));
        tx.set(doc(collection(db, 'classes', 'turma', 'teams', 't1', 'ledger')), ledgerEntry());
        tx.set(
          doc(collection(db, 'classes', 'turma', 'teams', 't1', 'ledger')),
          ledgerEntry({ delta: 3, reason: 'lock_first' }),
        );
        tx.update(doc(db, 'classes', 'turma', 'teams', 't1'), { totalPoints: 7 });
        tx.update(doc(db, 'sessions', 's1', 'players', 't1'), { episodePoints: 4 });
      }),
    );
  });

  it('total nunca negativo, nem salto grande, nem em outra dupla', async () => {
    const db = asTeam('t1');
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 't1'), { totalPoints: -1 }));
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 't1'), { totalPoints: 999 }));
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 't2'), { totalPoints: 4 }));
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 't1'), { cityName: 'Hack' }));
  });

  it('ledger: só para si, só motivos do jogo, sem "manual" e com valor limitado', async () => {
    const db = asTeam('t1');
    const led = (t: string) => doc(collection(db, 'classes', 'turma', 'teams', t, 'ledger'));
    await assertFails(setDoc(led('t2'), ledgerEntry()));
    await assertFails(setDoc(led('t1'), ledgerEntry({ reason: 'manual' })));
    await assertFails(setDoc(led('t1'), ledgerEntry({ delta: 50 })));
    await assertFails(setDoc(led('t1'), ledgerEntry({ by: 'ana' })));
    await assertFails(setDoc(led('t1'), ledgerEntry({ sessionId: 'outra' })));
  });

  it('sessão encerrada: nada de pontos', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'sessions', 's1'), { status: 'finished' });
    });
    const db = asTeam('t1');
    await assertFails(
      setDoc(doc(collection(db, 'classes', 'turma', 'teams', 't1', 'ledger')), ledgerEntry()),
    );
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 't1'), { totalPoints: 4 }));
  });
});

describe('progresso', () => {
  it('avança cadeado, compra dica e escolhe lado', async () => {
    const db = asTeam('t1');
    const p = doc(db, 'sessions', 's1', 'players', 't1');
    await assertSucceeds(updateDoc(p, { side: 'blue' }));
    await assertSucceeds(
      updateDoc(p, { 'progress.lockIndex': 1, solvedCount: 1, 'hints.blue-lock1': 1 }),
    );
  });

  it('o cadeado nunca volta nem passa de 3; lado inválido é recusado', async () => {
    const db = asTeam('t1');
    const p = doc(db, 'sessions', 's1', 'players', 't1');
    await assertSucceeds(updateDoc(p, { 'progress.lockIndex': 2 }));
    await assertFails(updateDoc(p, { 'progress.lockIndex': 1 }));
    await assertFails(updateDoc(p, { 'progress.lockIndex': 4 }));
    await assertFails(updateDoc(p, { side: 'verde' }));
    await assertFails(updateDoc(p, { matchId: 'm1' }));
  });
});

describe('bônus da primeira dupla (firsts)', () => {
  it('só a primeira consegue criar; ninguém altera depois', async () => {
    const ref = (db: Firestore) => doc(db, 'sessions', 's1', 'firsts', 'lock1');
    await assertSucceeds(setDoc(ref(asTeam('t1')), { teamId: 't1', at: serverTimestamp() }));
    await assertFails(setDoc(ref(asTeam('t2')), { teamId: 't2', at: serverTimestamp() }));
    await assertFails(updateDoc(ref(asTeam('t1')), { teamId: 't2' }));
    await assertSucceeds(getDoc(ref(asTeam('t2'))));
  });

  it('não dá para criar em nome de outra dupla', async () => {
    const db = asTeam('t1');
    await assertFails(
      setDoc(doc(db, 'sessions', 's1', 'firsts', 'lock2'), { teamId: 't2', at: serverTimestamp() }),
    );
  });
});

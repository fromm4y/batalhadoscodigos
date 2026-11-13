/**
 * Regras do Firestore — Etapa 2 (sessões e duplas).
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
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const ANA = { uid: 'ana-uid', email: 'ana@escola.br' };
const BIA = { uid: 'bia-uid', email: 'bia@escola.br' };

const asGoogle = (u: { uid: string; email: string }) =>
  env
    .authenticatedContext(u.uid, {
      email: u.email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore() as unknown as Firestore;

const asTeam = (teamId: string, sessionId = 's1', classId = 'turma-ana') =>
  env
    .authenticatedContext(`team_${teamId}_${sessionId}`, {
      role: 'team',
      teamId,
      classId,
      sessionId,
      firebase: { sign_in_provider: 'custom' },
    })
    .firestore() as unknown as Firestore;

const future = () => new Date(Date.now() + 3600_000);

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
    for (const u of [ANA, BIA]) {
      await setDoc(doc(db, 'allowedInstructors', u.email), {
        email: u.email,
        role: 'instructor',
        active: true,
        addedBy: 'seed',
        addedAt: new Date(),
      });
    }
    await setDoc(doc(db, 'classes', 'turma-ana'), {
      instructorId: ANA.uid,
      name: '6º A',
      archived: false,
    });
    await setDoc(doc(db, 'classes', 'turma-bia'), {
      instructorId: BIA.uid,
      name: '7º B',
      archived: false,
    });
    for (const [id, city] of [
      ['t1', 'Recife'],
      ['t2', 'Natal'],
    ] as const) {
      await setDoc(doc(db, 'classes', 'turma-ana', 'teams', id), {
        cityName: city,
        totalPoints: 0,
      });
      await setDoc(doc(db, 'classes', 'turma-ana', 'teams', id, 'private', 'auth'), {
        pinHash: 'scrypt$x$y',
        failedAttempts: 0,
        lockedUntil: null,
      });
    }
    await setDoc(doc(db, 'classes', 'turma-bia', 'teams', 'b1'), { cityName: 'Manaus' });
    await setDoc(doc(db, 'sessions', 's1'), {
      classId: 'turma-ana',
      instructorId: ANA.uid,
      code: 'K7Q2',
      status: 'open',
      phase: 'lobby',
      expiresAt: future(),
    });
    await setDoc(doc(db, 'sessions', 's1', 'players', 't1'), {
      teamId: 't1',
      connected: false,
      episodePoints: 0,
      side: null,
      progress: { lockIndex: 0 },
    });
    await setDoc(doc(db, 'sessions', 's1', 'players', 't2'), {
      teamId: 't2',
      connected: false,
      episodePoints: 0,
      side: null,
      progress: { lockIndex: 0 },
    });
  });
});

describe('dupla com sessão aberta', () => {
  it('lê a própria turma, as duplas da turma e a própria sessão', async () => {
    const db = asTeam('t1');
    await assertSucceeds(getDoc(doc(db, 'classes', 'turma-ana')));
    await assertSucceeds(getDocs(collection(db, 'classes', 'turma-ana', 'teams')));
    await assertSucceeds(getDoc(doc(db, 'sessions', 's1')));
    await assertSucceeds(getDoc(doc(db, 'sessions', 's1', 'players', 't1')));
  });

  it('não lê PIN, outra turma, outra sessão nem o estado de outra dupla', async () => {
    const db = asTeam('t1');
    await assertFails(getDoc(doc(db, 'classes', 'turma-ana', 'teams', 't1', 'private', 'auth')));
    await assertFails(getDoc(doc(db, 'classes', 'turma-bia')));
    await assertFails(getDocs(collection(db, 'classes', 'turma-bia', 'teams')));
    await assertFails(getDoc(doc(db, 'sessions', 's1', 'players', 't2')));
  });

  it('marca presença, mas não mexe em confronto, em outra dupla nem na sessão', async () => {
    const db = asTeam('t1');
    await assertSucceeds(
      updateDoc(doc(db, 'sessions', 's1', 'players', 't1'), {
        connected: true,
        lastSeenAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, 'sessions', 's1', 'players', 't1'), { matchId: 'm-falso' }),
    );
    await assertFails(updateDoc(doc(db, 'sessions', 's1', 'players', 't2'), { connected: true }));
    await assertFails(updateDoc(doc(db, 'sessions', 's1'), { phase: 'vault' }));
    await assertFails(
      updateDoc(doc(db, 'classes', 'turma-ana', 'teams', 't1'), { totalPoints: 999 }),
    );
    await assertFails(
      setDoc(doc(db, 'classes', 'turma-ana', 'teams', 'nova'), { cityName: 'Belém' }),
    );
  });
});

describe('dupla fora de sessão aberta', () => {
  it('sessão encerrada: não lê mais a turma nem marca presença, mas vê que encerrou', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'sessions', 's1'), { status: 'finished' });
    });
    const db = asTeam('t1');
    await assertSucceeds(getDoc(doc(db, 'sessions', 's1')));
    await assertFails(getDoc(doc(db, 'classes', 'turma-ana')));
    await assertFails(updateDoc(doc(db, 'sessions', 's1', 'players', 't1'), { connected: true }));
  });

  it('sessão vencida (3 h) também bloqueia', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'sessions', 's1'), {
        expiresAt: new Date(Date.now() - 1000),
      });
    });
    await assertFails(getDocs(collection(asTeam('t1'), 'classes', 'turma-ana', 'teams')));
  });

  it('token de uma sessão não abre outra sessão', async () => {
    await assertFails(getDoc(doc(asTeam('t1', 's-outra'), 'sessions', 's1')));
  });
});

describe('Narradora e sessões', () => {
  it('a dona lê a sessão, as duplas e encerra a sessão', async () => {
    const db = asGoogle(ANA);
    await assertSucceeds(getDoc(doc(db, 'sessions', 's1')));
    await assertSucceeds(getDocs(collection(db, 'sessions', 's1', 'players')));
    await assertSucceeds(getDocs(collection(db, 'classes', 'turma-ana', 'teams')));
    await assertSucceeds(updateDoc(doc(db, 'sessions', 's1'), { status: 'finished' }));
  });

  it('não cria sessão pelo cliente nem troca código/turma', async () => {
    const db = asGoogle(ANA);
    await assertFails(
      setDoc(doc(db, 'sessions', 'nova'), {
        classId: 'turma-ana',
        instructorId: ANA.uid,
        code: 'AAAA',
        status: 'open',
        phase: 'lobby',
      }),
    );
    await assertFails(updateDoc(doc(db, 'sessions', 's1'), { code: 'BBBB' }));
    await assertFails(updateDoc(doc(db, 'sessions', 's1'), { classId: 'turma-bia' }));
    await assertFails(updateDoc(doc(db, 'sessions', 's1'), { phase: 'festa' }));
  });

  it('outra Narradora não vê a sessão nem as duplas', async () => {
    const db = asGoogle(BIA);
    await assertFails(getDoc(doc(db, 'sessions', 's1')));
    await assertFails(getDocs(collection(db, 'sessions', 's1', 'players')));
    await assertFails(getDocs(collection(db, 'classes', 'turma-ana', 'teams')));
    await assertFails(getDoc(doc(db, 'classes', 'turma-ana', 'teams', 't1', 'private', 'auth')));
  });
});

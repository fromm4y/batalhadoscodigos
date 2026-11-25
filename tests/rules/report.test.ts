/**
 * Regras do Firestore — SPEC-02 F: tentativas (a dupla só cria as próprias) e resumo do relatório.
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const ANA = { uid: 'ana-uid', email: 'ana@escola.br' };
const asTeam = (teamId: string) =>
  env
    .authenticatedContext(`team_${teamId}_s1`, {
      role: 'team',
      teamId,
      classId: 'turma',
      sessionId: 's1',
      firebase: { sign_in_provider: 'custom' },
    })
    .firestore() as unknown as Firestore;
const asAna = () =>
  env
    .authenticatedContext(ANA.uid, {
      email: ANA.email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore() as unknown as Firestore;

const attempt = (teamId: string) => ({
  teamId,
  episodeId: 'ep1',
  challengeKey: 'red-lock1',
  level: 'B',
  side: 'red',
  correct: true,
  hintLevel: 0,
  msSinceChallengeStart: 30000,
  at: serverTimestamp(),
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
    await setDoc(doc(db, 'allowedInstructors', ANA.email), {
      email: ANA.email,
      role: 'instructor',
      active: true,
    });
    await setDoc(doc(db, 'classes', 'turma'), { instructorId: ANA.uid, archived: false });
    await setDoc(doc(db, 'sessions', 's1'), {
      classId: 'turma',
      instructorId: ANA.uid,
      status: 'open',
      phase: 'locks',
      expiresAt: new Date(Date.now() + 3600_000),
    });
  });
});

describe('relatório da turma (SPEC-02 F)', () => {
  it('a dupla registra só as próprias tentativas e não lê as das outras', async () => {
    const col = (db: Firestore) => collection(db, 'sessions', 's1', 'attempts');
    await assertSucceeds(addDoc(col(asTeam('a')), attempt('a')));
    await assertFails(addDoc(col(asTeam('a')), attempt('b')));
    await assertFails(addDoc(col(asTeam('a')), { ...attempt('a'), nome: 'Maria' }));
    await assertFails(getDocs(col(asTeam('a'))));
    await assertSucceeds(getDocs(col(asAna())));
  });
  it('o resumo é da dona da turma; a dupla não lê', async () => {
    const ref = (db: Firestore) => doc(db, 'classes', 'turma', 'reports', 'ep1');
    await assertSucceeds(setDoc(ref(asAna()), { episodeId: 'ep1', teams: 2, attempts: 4 }));
    await assertSucceeds(getDoc(ref(asAna())));
    await assertFails(getDoc(ref(asTeam('a'))));
    await assertFails(setDoc(ref(asTeam('a')), { episodeId: 'ep1', teams: 9, attempts: 9 }));
  });
});

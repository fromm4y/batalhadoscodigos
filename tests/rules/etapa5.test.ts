/**
 * Regras do Firestore — Etapa 5 (chamados de ajuda, feed, ações da Narradora por dupla).
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
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
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
    await setDoc(doc(db, 'classes', 'turma'), { instructorId: ANA.uid });
    await setDoc(doc(db, 'sessions', 's1'), {
      classId: 'turma',
      instructorId: ANA.uid,
      status: 'open',
      phase: 'locks',
      expiresAt: new Date(Date.now() + 3600_000),
    });
    for (const t of ['t1', 't2'])
      await setDoc(doc(db, 'sessions', 's1', 'players', t), {
        teamId: t,
        connected: true,
        matchId: null,
        side: 'red',
        helpUsed: false,
        progress: { lockIndex: 0 },
        hints: {},
      });
  });
});

describe('chamado de ajuda', () => {
  it('a dupla chama só em nome dela; a Narradora vê e marca como atendido', async () => {
    const help = (db: Firestore, teamId: string) =>
      setDoc(doc(collection(db, 'sessions', 's1', 'helpRequests'), 'h1'), {
        teamId,
        challengeKey: 'red-lock1',
        createdAt: serverTimestamp(),
        status: 'open',
      });
    await assertFails(help(asTeam('t1'), 't2'));
    await assertSucceeds(help(asTeam('t1'), 't1'));
    await assertSucceeds(
      updateDoc(doc(asTeam('t1'), 'sessions', 's1', 'players', 't1'), { helpUsed: true }),
    );
    await assertSucceeds(getDocs(collection(asAna(), 'sessions', 's1', 'helpRequests')));
    await assertSucceeds(
      updateDoc(doc(asAna(), 'sessions', 's1', 'helpRequests', 'h1'), { status: 'done' }),
    );
    await assertFails(
      updateDoc(doc(asTeam('t1'), 'sessions', 's1', 'helpRequests', 'h1'), { status: 'done' }),
    );
  });
});

describe('feed', () => {
  it('a dupla escreve só em nome dela; só a Narradora lê', async () => {
    const entry = (teamId: string) => ({
      teamId,
      type: 'lock_open',
      payload: { text: 'abriu' },
      at: serverTimestamp(),
    });
    await assertSucceeds(
      setDoc(doc(collection(asTeam('t1'), 'sessions', 's1', 'feed')), entry('t1')),
    );
    await assertFails(setDoc(doc(collection(asTeam('t1'), 'sessions', 's1', 'feed')), entry('t2')));
    await assertFails(getDocs(collection(asTeam('t1'), 'sessions', 's1', 'feed')));
    await assertSucceeds(getDocs(collection(asAna(), 'sessions', 's1', 'feed')));
  });
});

describe('ações da Narradora por dupla', () => {
  it('dá dica, habilidade e muda a fase só de uma dupla; a dupla não muda a própria fase', async () => {
    const p = doc(asAna(), 'sessions', 's1', 'players', 't1');
    await assertSucceeds(
      updateDoc(p, { 'hints.red-lock1': 1, 'abilities.owned': ['planoB'], phaseOverride: 'vault' }),
    );
    await assertFails(
      updateDoc(doc(asTeam('t1'), 'sessions', 's1', 'players', 't1'), { phaseOverride: 'end' }),
    );
  });

  it('congela e descongela as telas', async () => {
    await assertSucceeds(
      updateDoc(doc(asAna(), 'sessions', 's1'), {
        freeze: { active: true, message: '', startedAtMs: 1 },
      }),
    );
  });
});

describe('destaque da aula (Etapa 6)', () => {
  it('a dupla só lê os pontos de hoje das outras duplas na fase de fim', async () => {
    const other = () => getDocs(collection(asTeam('t1'), 'sessions', 's1', 'players'));
    await assertFails(other());
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), 'sessions', 's1'), { phase: 'end' }),
    );
    await assertSucceeds(other());
    // ler não dá direito de escrever no documento de outra dupla
    await assertFails(
      updateDoc(doc(asTeam('t1'), 'sessions', 's1', 'players', 't2'), { connected: false }),
    );
  });
});

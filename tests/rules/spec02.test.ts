/**
 * Regras do Firestore — SPEC-02 Partes A e B: alarme por eleição (qualquer dupla dispara, só
 * na hora certa), turma arquivada somente leitura, `config/season` e `auditLog`.
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const ANA = { uid: 'ana-uid', email: 'ana@escola.br' };
const BIA = { uid: 'bia-uid', email: 'bia@escola.br' };
const CHEFE = { uid: 'chefe-uid', email: 'chefe@escola.br' };
const google = (u: { uid: string; email: string }) =>
  env
    .authenticatedContext(u.uid, {
      email: u.email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore() as unknown as Firestore;
const asTeam = () =>
  env
    .authenticatedContext('team_t1_s1', {
      role: 'team',
      teamId: 't1',
      classId: 'turma',
      sessionId: 's1',
      firebase: { sign_in_provider: 'custom' },
    })
    .firestore() as unknown as Firestore;

const CLASS = {
  schoolId: 'cavazza',
  instructorId: ANA.uid,
  name: '6º A',
  grade: 6,
  level: 'B',
  shift: 'manha',
  season: '2026-T4',
  archived: false,
  createdAt: new Date(0),
};

async function seed(session: Record<string, unknown> = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [u, role] of [
      [ANA, 'instructor'],
      [BIA, 'instructor'],
      [CHEFE, 'admin'],
    ] as const)
      await setDoc(doc(db, 'allowedInstructors', u.email), { email: u.email, role, active: true });
    await setDoc(doc(db, 'schools', 'cavazza'), { name: 'Cavazza', active: true });
    await setDoc(doc(db, 'classes', 'turma'), CLASS);
    await setDoc(doc(db, 'sessions', 's1'), {
      classId: 'turma',
      instructorId: ANA.uid,
      status: 'open',
      phase: 'locks',
      expiresAt: new Date(Date.now() + 3600_000),
      freeze: { active: false, message: '' },
      museumEvent: { status: 'idle', startedAt: null, triggeredBy: null },
      autoEventAt: new Date(Date.now() - 1000),
      ...session,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cacada',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

const fire = (db: Firestore, triggeredBy = 'auto', extra: Record<string, unknown> = {}) =>
  updateDoc(doc(db, 'sessions', 's1'), {
    museumEvent: { status: 'running', startedAt: serverTimestamp(), triggeredBy },
    ...extra,
  });

describe('alarme por eleição (SPEC-02 A1)', () => {
  it('a dupla dispara o automático depois do horário sorteado', async () => {
    await seed();
    await assertSucceeds(fire(asTeam()));
  });
  it('antes da hora, não', async () => {
    await seed({ autoEventAt: new Date(Date.now() + 60_000) });
    await assertFails(fire(asTeam()));
  });
  it('só o disparo automático, sem mexer em mais nada', async () => {
    await seed();
    await assertFails(fire(asTeam(), 'instructor'));
    await assertFails(fire(asTeam(), 'auto', { phase: 'vault' }));
  });
  it('com as telas congeladas ou o evento já em andamento, não', async () => {
    await seed({ freeze: { active: true, message: '' } });
    await assertFails(fire(asTeam()));
    await env.clearFirestore();
    await seed({ museumEvent: { status: 'running', startedAt: new Date(), triggeredBy: 'auto' } });
    await assertFails(fire(asTeam()));
  });
});

describe('turma arquivada (SPEC-02 A2)', () => {
  it('a dona arquiva; arquivada fica somente leitura; dá para desarquivar', async () => {
    await seed();
    await assertSucceeds(updateDoc(doc(google(ANA), 'classes', 'turma'), { archived: true }));
    await assertFails(updateDoc(doc(google(ANA), 'classes', 'turma'), { name: 'Outro nome' }));
    await assertSucceeds(updateDoc(doc(google(ANA), 'classes', 'turma'), { archived: false }));
    await assertSucceeds(updateDoc(doc(google(ANA), 'classes', 'turma'), { name: 'Outro nome' }));
  });
  it('a admin arquiva a turma de outra Narradora; outra Narradora não', async () => {
    await seed();
    await assertFails(updateDoc(doc(google(BIA), 'classes', 'turma'), { archived: true }));
    await assertSucceeds(updateDoc(doc(google(CHEFE), 'classes', 'turma'), { archived: true }));
    await assertFails(
      updateDoc(doc(google(CHEFE), 'classes', 'turma'), { archived: false, name: 'x' }),
    );
  });
});

describe('config/season e auditLog', () => {
  it('todo mundo lê a ordem da temporada; só a admin muda, e só para long/short', async () => {
    await seed();
    await assertSucceeds(getDoc(doc(asTeam(), 'config', 'season')));
    await assertSucceeds(getDoc(doc(google(ANA), 'config', 'season')));
    await assertFails(setDoc(doc(google(ANA), 'config', 'season'), { order: 'short' }));
    await assertSucceeds(setDoc(doc(google(CHEFE), 'config', 'season'), { order: 'short' }));
    await assertFails(setDoc(doc(google(CHEFE), 'config', 'season'), { order: 'gigante' }));
  });
  it('auditLog: só a admin lê; ninguém grava pelo navegador', async () => {
    await seed();
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'auditLog', 'a1'), { action: 'season-close' }),
    );
    await assertFails(getDoc(doc(google(ANA), 'auditLog', 'a1')));
    await assertSucceeds(getDoc(doc(google(CHEFE), 'auditLog', 'a1')));
    await assertFails(setDoc(doc(google(CHEFE), 'auditLog', 'a2'), { action: 'x' }));
  });
});

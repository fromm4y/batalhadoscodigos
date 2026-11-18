/**
 * Regras do Firestore — Ep. 5, modo cooperativo (SPEC-03 §4.1): o confronto `coop` da Aliança.
 */
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, type Firestore } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const ANA = { uid: 'ana-uid', email: 'ana@escola.br' };

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

const asAna = () =>
  env
    .authenticatedContext(ANA.uid, {
      email: ANA.email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore() as unknown as Firestore;

const coopMatch = (teams: string[], vaultSolvers: string[] = []) => ({
  redTeamId: null,
  blueTeamId: null,
  machineSide: 'blue',
  bar: 0,
  effects: [],
  vaultLeader: null,
  winner: null,
  resolvedAt: null,
  log: [],
  machine: { lockIndex: 0, phase: null, nextAt: null, vaultSolved: false, usedAbilities: [] },
  coop: { teams, vaultSolvers, reinforcements: {} },
});

const ref = (db: Firestore) => doc(db, 'sessions', 's1', 'matches', 'coop');

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
      phase: 'vault',
      expiresAt: new Date(Date.now() + 3600_000),
    });
    for (const t of ['a', 'b', 'c']) {
      await setDoc(doc(db, 'sessions', 's1', 'players', t), {
        teamId: t,
        connected: true,
        side: null,
        matchId: null,
        progress: { lockIndex: 0 },
        episodePoints: 0,
      });
    }
    await setDoc(ref(db as unknown as Firestore), coopMatch(['a', 'b'], ['a']));
  });
});

describe('Aliança (confronto coop)', () => {
  it('toda dupla da sessão lê e puxa a barra pela turma', async () => {
    await assertSucceeds(getDoc(ref(asTeam('c'))));
    await assertSucceeds(updateDoc(ref(asTeam('b')), { bar: -5 }));
    await assertFails(getDoc(ref(asTeam('a', 's2'))));
  });

  it('a dupla entra sozinha na Aliança, e só ela mesma', async () => {
    const coop = { teams: ['a', 'b', 'c'], vaultSolvers: ['a'], reinforcements: {} };
    await assertFails(updateDoc(ref(asTeam('b')), { coop }));
    await assertSucceeds(updateDoc(ref(asTeam('c')), { coop }));
    const p = doc(asTeam('c'), 'sessions', 's1', 'players', 'c');
    await assertSucceeds(updateDoc(p, { matchId: 'coop', side: 'red', mode: 'coop' }));
  });

  it('ninguém sai da Aliança nem apaga um Cofre aberto', async () => {
    await assertFails(
      updateDoc(ref(asTeam('b')), {
        coop: { teams: ['b'], vaultSolvers: ['a'], reinforcements: {} },
      }),
    );
    await assertFails(
      updateDoc(ref(asTeam('b')), {
        coop: { teams: ['a', 'b'], vaultSolvers: [], reinforcements: {} },
      }),
    );
  });

  it('abrir o Cofre: só se coloca a si mesma', async () => {
    await assertSucceeds(
      updateDoc(ref(asTeam('b')), {
        coop: { teams: ['a', 'b'], vaultSolvers: ['a', 'b'], reinforcements: {} },
        winner: 'red',
        bar: -100,
      }),
    );
    await assertFails(
      updateDoc(ref(asTeam('b')), {
        coop: { teams: ['a', 'b'], vaultSolvers: ['a', 'b', 'c'], reinforcements: {} },
      }),
    );
  });

  it('reforço: a dupla manda só o próprio, e o vencedor não muda', async () => {
    await assertFails(
      updateDoc(ref(asTeam('b')), {
        coop: { teams: ['a', 'b'], vaultSolvers: ['a'], reinforcements: { a: 'b' } },
      }),
    );
    await assertSucceeds(
      updateDoc(ref(asTeam('a')), {
        coop: { teams: ['a', 'b'], vaultSolvers: ['a'], reinforcements: { a: 'b' } },
      }),
    );
    const p = doc(asTeam('b'), 'sessions', 's1', 'players', 'b');
    await assertSucceeds(updateDoc(p, { reinforcedBy: 'a', hints: { 'coop-vault': 1 } }));
    await assertFails(updateDoc(p, { reinforcedBy: 'c' }));
  });

  it('a Narradora lança o resultado da Aliança', async () => {
    await assertSucceeds(updateDoc(ref(asAna()), { winner: 'red', coopAwarded: true }));
    await assertFails(updateDoc(ref(asTeam('a')), { coopAwarded: false }));
  });
});

describe('certificado da temporada (SPEC-02 E)', () => {
  it('a dupla lê só o nome da própria escola; a lista de escolas continua fechada', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'classes', 'turma'), {
        instructorId: ANA.uid,
        archived: false,
        schoolId: 'esc1',
      });
      await setDoc(doc(db, 'schools', 'esc1'), { name: 'Escola 1', active: true });
      await setDoc(doc(db, 'schools', 'esc2'), { name: 'Escola 2', active: true });
    });
    await assertSucceeds(getDoc(doc(asTeam('a'), 'schools', 'esc1')));
    await assertFails(getDoc(doc(asTeam('a'), 'schools', 'esc2')));
  });
});

/**
 * Regras do Firestore — Etapa 4 (confrontos, cabo de guerra, pontos da Narradora).
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

const match = (red: string | null, blue: string | null, machineSide: string | null = null) => ({
  redTeamId: red,
  blueTeamId: blue,
  machineSide,
  bar: 0,
  effects: [],
  vaultLeader: null,
  winner: null,
  resolvedAt: null,
  log: [],
  machine: null,
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
    for (const t of ['r1', 'b1', 'x1']) {
      await setDoc(doc(db, 'classes', 'turma', 'teams', t), { cityName: t, totalPoints: 3 });
      await setDoc(doc(db, 'sessions', 's1', 'players', t), {
        teamId: t,
        connected: true,
        side: null,
        matchId: null,
        progress: { lockIndex: 0 },
        episodePoints: 0,
      });
    }
    await setDoc(doc(db, 'sessions', 's1', 'matches', 'pvp_r1_b1'), match('r1', 'b1'));
  });
});

describe('confrontos', () => {
  it('participantes leem e puxam a barra; quem está fora nem lê', async () => {
    const ref = (db: Firestore) => doc(db, 'sessions', 's1', 'matches', 'pvp_r1_b1');
    await assertSucceeds(getDoc(ref(asTeam('r1'))));
    await assertSucceeds(updateDoc(ref(asTeam('b1')), { bar: 20 }));
    await assertFails(getDoc(ref(asTeam('x1'))));
    await assertFails(updateDoc(ref(asTeam('x1')), { bar: -20 }));
  });

  it('a barra fica entre −100 e +100; ninguém troca as duplas do confronto', async () => {
    const ref = doc(asTeam('r1'), 'sessions', 's1', 'matches', 'pvp_r1_b1');
    await assertFails(updateDoc(ref, { bar: -150 }));
    await assertFails(updateDoc(ref, { blueTeamId: 'x1' }));
    await assertFails(updateDoc(ref, { vaultLeader: 'red' }));
  });

  it('o vencedor não muda depois de definido', async () => {
    const ref = (db: Firestore) => doc(db, 'sessions', 's1', 'matches', 'pvp_r1_b1');
    await assertSucceeds(updateDoc(ref(asTeam('r1')), { winner: 'red', bar: -100 }));
    await assertFails(updateDoc(ref(asTeam('b1')), { winner: 'blue', bar: 100 }));
  });

  it('dupla atrasada cria só o próprio confronto contra a máquina', async () => {
    const db = asTeam('x1');
    await assertSucceeds(
      setDoc(doc(db, 'sessions', 's1', 'matches', 'maq_x1'), match('x1', null, 'blue')),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'sessions', 's1', 'players', 'x1'), { matchId: 'maq_x1', side: 'red' }),
    );
    await assertFails(
      setDoc(doc(db, 'sessions', 's1', 'matches', 'maq_r1'), match('r1', null, 'blue')),
    );
    await assertFails(setDoc(doc(db, 'sessions', 's1', 'matches', 'pvp_x1_b1'), match('x1', 'b1')));
    await assertFails(
      updateDoc(doc(db, 'sessions', 's1', 'players', 'x1'), { matchId: 'pvp_r1_b1' }),
    );
  });
});

describe('Narradora', () => {
  it('forma confrontos, liga as duplas e define a vantagem do Cofre', async () => {
    const db = asAna();
    await assertSucceeds(
      setDoc(doc(db, 'sessions', 's1', 'matches', 'maq_x1'), match('x1', null, 'blue')),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'sessions', 's1', 'players', 'x1'), { matchId: 'maq_x1', side: 'red' }),
    );
    await assertSucceeds(
      updateDoc(doc(db, 'sessions', 's1', 'matches', 'pvp_r1_b1'), { vaultLeader: 'blue' }),
    );
  });

  it('lança pontos de confronto em nome dela', async () => {
    const db = asAna();
    await assertSucceeds(
      setDoc(doc(collection(db, 'classes', 'turma', 'teams', 'r1', 'ledger')), {
        sessionId: 's1',
        episodeId: 'ep1',
        delta: 2,
        reason: 'side_bonus',
        at: serverTimestamp(),
        by: ANA.uid,
      }),
    );
    await assertSucceeds(updateDoc(doc(db, 'classes', 'turma', 'teams', 'r1'), { totalPoints: 5 }));
    await assertFails(updateDoc(doc(db, 'classes', 'turma', 'teams', 'r1'), { totalPoints: -1 }));
    await assertFails(
      setDoc(doc(collection(db, 'classes', 'turma', 'teams', 'r1', 'ledger')), {
        sessionId: 's1',
        episodeId: 'ep1',
        delta: 2,
        reason: 'side_bonus',
        at: serverTimestamp(),
        by: 'game',
      }),
    );
  });
});

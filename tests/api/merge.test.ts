/**
 * Mesclar (25/11) contra os emuladores: ficha repetida da dupla na original e turma na turma.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp as initClient, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth as getClientAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdmin } from '../../api/_lib/admin';
import merge from '../../api/merge';

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;
type Result = { status: number; body: Record<string, unknown> };

let ipCounter = 0;
async function call(
  handler: Handler,
  payload: unknown,
  opts: { token?: string; ip?: string } = {},
): Promise<Result> {
  const out: Result = { status: 200, body: {} };
  const res = {
    status(c: number) {
      out.status = c;
      return res;
    },
    json(b: Record<string, unknown>) {
      out.body = b;
    },
    setHeader() {},
  };
  const req = {
    method: 'POST',
    body: payload,
    headers: {
      'x-forwarded-for': opts.ip ?? `10.0.0.${++ipCounter}`,
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
    },
  };
  await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
  return out;
}

const { db } = getAdmin();
let clientApp: FirebaseApp;
let anaToken = '';
let chefeToken = '';
let biaToken = '';
let anaUid = '';

async function googleToken(email: string): Promise<{ token: string; uid: string }> {
  const auth = getClientAuth(clientApp);
  const cred = await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })),
  );
  return { token: await cred.user.getIdToken(), uid: cred.user.uid };
}

beforeAll(async () => {
  clientApp = initClient(
    { apiKey: 'demo', projectId: 'demo-cacada', appId: 'demo' },
    'api-tests-merge',
  );
  connectAuthEmulator(getClientAuth(clientApp), 'http://127.0.0.1:9099', { disableWarnings: true });
  for (const email of ['ana@teste.br', 'bia@teste.br', 'chefe@teste.br']) {
    await db.doc(`allowedInstructors/${email}`).set({
      email,
      role: email === 'chefe@teste.br' ? 'admin' : 'instructor',
      active: true,
      addedBy: 'teste',
      addedAt: new Date(),
    });
  }
  const ana = await googleToken('ana@teste.br');
  anaToken = ana.token;
  anaUid = ana.uid;
  chefeToken = (await googleToken('chefe@teste.br')).token;
  biaToken = (await googleToken('bia@teste.br')).token;
});

afterAll(async () => {
  await deleteApp(clientApp);
});

beforeEach(async () => {
  for (const col of ['classes', 'sessions', 'auditLog'])
    await db.recursiveDelete(db.collection(col));
  await db.doc('classes/c1').set({ instructorId: anaUid, name: '6º A', archived: false });
  await db.doc('classes/c2').set({ instructorId: anaUid, name: '6º A avançados', archived: false });
  // ficha original (c1/orig) e a repetida que a dupla criou numa sessão separada (c1/dup)
  await db.doc('classes/c1/teams/orig').set({
    cityName: 'Recife',
    totalPoints: 10,
    episodesPlayed: 2,
    cards: [{ episodeId: 'ep1', variant: 'normal' }],
    badges: [{ id: 'semDicas', episodeId: 'ep1' }],
    stamps: [
      { episodeId: 'ep1', side: 'red', result: 'perdeu' },
      { episodeId: 'ep2', side: 'red', result: 'jogou' },
    ],
  });
  await db.doc('classes/c1/teams/orig/ledger/a').set({ delta: 10, reason: 'manual' });
  await db.doc('classes/c1/teams/orig/private/auth').set({ pinHash: 'pin-original' });
  await db.doc('classes/c1/teams/dup').set({
    cityName: 'Recife 2',
    totalPoints: 6,
    episodesPlayed: 1,
    cards: [
      { episodeId: 'ep1', variant: 'dourada' },
      { episodeId: 'ep3', variant: 'normal' },
    ],
    badges: [
      { id: 'semDicas', episodeId: 'ep1' },
      { id: 'missaoBonus', episodeId: 'ep3' },
    ],
    stamps: [{ episodeId: 'ep3', side: 'blue', result: 'venceu' }],
  });
  await db.doc('classes/c1/teams/dup/ledger/b').set({ delta: 6, reason: 'manual' });
  await db.doc('classes/c1/teams/dup/private/auth').set({ pinHash: 'pin-repetido' });
  await db.doc('sessions/s1').set({ classId: 'c1', instructorId: anaUid, status: 'finished' });
  await db
    .doc('sessions/s1/players/dup')
    .set({ teamId: 'dup', abilities: { owned: ['escudo'], used: [] } });
  await db.doc('sessions/s1/matches/maq_dup').set({ redTeamId: 'dup', blueTeamId: null });
});

describe('mesclar fichas da mesma dupla', () => {
  it('só a dona da turma (ou a admin)', async () => {
    const p = { kind: 'teams', classId: 'c1', keepId: 'orig', fromId: 'dup' };
    expect((await call(merge, p, { token: biaToken })).status).toBe(403);
    expect((await call(merge, p)).status).toBe(401);
    // a admin passa da checagem de dona (aqui a ficha não existe)
    expect((await call(merge, { ...p, fromId: 'naoExiste' }, { token: chefeToken })).status).toBe(
      404,
    );
    expect((await call(merge, { ...p, fromId: 'orig' }, { token: anaToken })).status).toBe(400);
  });

  it('junta pontos, cartas, selos, carimbos e o progresso das sessões; apaga a repetida', async () => {
    const r = await call(
      merge,
      { kind: 'teams', classId: 'c1', keepId: 'orig', fromId: 'dup' },
      { token: anaToken },
    );
    expect(r.status).toBe(200);
    const t = (await db.doc('classes/c1/teams/orig').get()).data()!;
    expect(t.totalPoints).toBe(16);
    expect(t.cityName).toBe('Recife'); // a identidade é a da ficha que fica
    expect(t.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ episodeId: 'ep1', variant: 'dourada' }),
        expect.objectContaining({ episodeId: 'ep3' }),
      ]),
    );
    expect(t.badges).toHaveLength(2); // semDicas do ep1 não repete
    expect(t.stamps).toHaveLength(3);
    expect(t.episodesPlayed).toBe(3);
    expect((await db.collection('classes/c1/teams/orig/ledger').get()).size).toBe(2);
    expect((await db.doc('classes/c1/teams/orig/private/auth').get()).data()?.pinHash).toBe(
      'pin-original',
    );
    const p = (await db.doc('sessions/s1/players/orig').get()).data();
    expect(p?.abilities.owned).toEqual(['escudo']);
    expect((await db.doc('sessions/s1/players/dup').get()).exists).toBe(false);
    expect((await db.doc('sessions/s1/matches/maq_dup').get()).data()?.redTeamId).toBe('orig');
    expect((await db.doc('classes/c1/teams/dup').get()).exists).toBe(false);
    expect((await db.doc('classes/c1/teams/dup/private/auth').get()).exists).toBe(false);
  });
});

describe('juntar turmas', () => {
  it('pede o nome da turma que vai sumir e leva duplas e sessões', async () => {
    await db.doc('classes/c2/teams/x').set({ cityName: 'Natal', totalPoints: 4 });
    await db.doc('classes/c2/teams/x/ledger/l').set({ delta: 4, reason: 'manual' });
    await db.doc('classes/c2/teams/x/private/auth').set({ pinHash: 'pin-x' });
    await db.doc('sessions/s9').set({ classId: 'c2', instructorId: anaUid, status: 'finished' });
    const p = { kind: 'classes', keepClassId: 'c1', fromClassId: 'c2' };
    expect((await call(merge, { ...p, confirmName: 'errado' }, { token: anaToken })).status).toBe(
      400,
    );
    const r = await call(merge, { ...p, confirmName: '6º A avançados' }, { token: anaToken });
    expect(r.status).toBe(200);
    expect((await db.doc('classes/c1/teams/x').get()).data()?.totalPoints).toBe(4);
    expect((await db.doc('classes/c1/teams/x/ledger/l').get()).exists).toBe(true);
    expect((await db.doc('classes/c1/teams/x/private/auth').get()).data()?.pinHash).toBe('pin-x');
    expect((await db.doc('sessions/s9').get()).data()?.classId).toBe('c1');
    expect((await db.doc('classes/c2').get()).exists).toBe(false);
  });

  it('não junta com sessão aberta na outra turma', async () => {
    await db.doc('sessions/s8').set({ classId: 'c2', instructorId: anaUid, status: 'open' });
    const r = await call(
      merge,
      { kind: 'classes', keepClassId: 'c1', fromClassId: 'c2', confirmName: '6º A avançados' },
      { token: anaToken },
    );
    expect(r.status).toBe(409);
  });
});

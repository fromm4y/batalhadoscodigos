/**
 * Banco reserva (23/11) contra os emuladores: importar os dados de OUTRO projeto do Firebase
 * (origem `demo-origem`) para este (`demo-cacada`), traduzindo o dono das turmas pelo e-mail.
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
import adminImport from '../../api/admin-import';
import { getSourceDb } from '../../api/_lib/admin';

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
let anaUid = '';

async function googleToken(email: string): Promise<{ token: string; uid: string }> {
  const auth = getClientAuth(clientApp);
  const cred = await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(JSON.stringify({ sub: email, email, email_verified: true })),
  );
  return { token: await cred.user.getIdToken(), uid: cred.user.uid };
}

process.env.FIREBASE_SOURCE_PROJECT = 'demo-origem';
const src = getSourceDb()!.db;

beforeAll(async () => {
  clientApp = initClient(
    { apiKey: 'demo', projectId: 'demo-cacada', appId: 'demo' },
    'api-tests-import',
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
  await googleToken('bia@teste.br');
  chefeToken = (await googleToken('chefe@teste.br')).token;
});

afterAll(async () => {
  await deleteApp(clientApp);
});

beforeEach(async () => {
  for (const col of ['classes', 'sessions', 'instructors', 'schools', 'config', 'auditLog'])
    await db.recursiveDelete(db.collection(col));
  for (const col of ['classes', 'sessions', 'instructors', 'schools', 'allowedInstructors'])
    await src.recursiveDelete(src.collection(col));
  // origem: a Ana tinha OUTRO uid lá; a Zoe nunca entrou neste projeto
  await src.doc('instructors/uid-antigo-ana').set({ uid: 'uid-antigo-ana', email: 'ana@teste.br' });
  await src.doc('instructors/uid-zoe').set({ uid: 'uid-zoe', email: 'zoe@teste.br' });
  await src
    .doc('allowedInstructors/zoe@teste.br')
    .set({ email: 'zoe@teste.br', role: 'instructor', active: true });
  await src.doc('schools/cavazza').set({ name: 'EMEF Armando Cavazza', active: true });
  await src
    .doc('classes/c1')
    .set({ instructorId: 'uid-antigo-ana', name: '6º A', archived: false });
  await src.doc('classes/c2').set({ instructorId: 'uid-zoe', name: '7º B', archived: false });
  await src
    .doc('classes/c1/teams/t1')
    .set({ cityName: 'Recife', totalPoints: 7, cards: [{ episodeId: 'ep1', variant: 'dourada' }] });
  await src.doc('classes/c1/teams/t1/ledger/l1').set({ delta: 7, reason: 'manual' });
  await src.doc('classes/c1/teams/t1/private/auth').set({ pinHash: 'hash' });
  await src
    .doc('sessions/s1')
    .set({ classId: 'c1', instructorId: 'uid-antigo-ana', phase: 'end', episodeId: 'ep1' });
  await src.doc('sessions/s1/players/t1').set({ teamId: 't1', episodePoints: 7 });
  await src.doc('sessions/s1/feed/f1').set({ text: 'linha do tempo' });
});

describe('importar de outro banco (banco reserva)', () => {
  it('só a admin, e só confirmando com COPIAR', async () => {
    expect((await call(adminImport, { confirm: 'COPIAR' }, { token: anaToken })).status).toBe(403);
    expect((await call(adminImport, {}, { token: chefeToken })).status).toBe(400);
    expect((await call(adminImport, { confirm: 'COPIAR' })).status).toBe(401);
  });

  it('copia turmas, duplas, PIN, pontos, cartas e sessões, e traduz o dono pelo e-mail', async () => {
    const r = await call(adminImport, { confirm: 'COPIAR' }, { token: chefeToken });
    expect(r.status).toBe(200);
    expect(r.body.from).toBe('demo-origem');
    expect(r.body.unmapped).toEqual(['zoe@teste.br']);
    expect((await db.doc('classes/c1').get()).data()?.instructorId).toBe(anaUid);
    expect((await db.doc(`instructors/${anaUid}`).get()).data()?.uid).toBe(anaUid);
    // a Zoe ainda não entrou aqui: a turma dela vem, mas com o uid antigo (importar de novo depois)
    expect((await db.doc('classes/c2').get()).data()?.instructorId).toBe('uid-zoe');
    const team = (await db.doc('classes/c1/teams/t1').get()).data();
    expect(team?.totalPoints).toBe(7);
    expect(team?.cards).toHaveLength(1);
    expect((await db.doc('classes/c1/teams/t1/ledger/l1').get()).exists).toBe(true);
    expect((await db.doc('classes/c1/teams/t1/private/auth').get()).data()?.pinHash).toBe('hash');
    expect((await db.doc('sessions/s1').get()).data()?.instructorId).toBe(anaUid);
    expect((await db.doc('sessions/s1/players/t1').get()).exists).toBe(true);
    expect((await db.doc('sessions/s1/feed/f1').get()).exists).toBe(false);
    expect((await db.doc('schools/cavazza').get()).exists).toBe(true);
    expect((await db.collection('auditLog').where('action', '==', 'import').get()).size).toBe(1);
  });

  it('MESCLA: pontos dos dois bancos somam sem duplicar; o destino não perde nada', async () => {
    await call(adminImport, { confirm: 'COPIAR' }, { token: chefeToken });
    // aula no DESTINO (reserva): +3 e uma carta nova
    await db.doc('classes/c1/teams/t1/ledger/l2').set({ delta: 3, reason: 'lock_open' });
    await db.doc('classes/c1/teams/t1').update({
      totalPoints: 10,
      cards: [
        { episodeId: 'ep1', variant: 'normal' },
        { episodeId: 'ep2', variant: 'normal' },
      ],
    });
    // aula na ORIGEM: +5 e a mesma sessão que já veio
    await src.doc('classes/c1/teams/t1/ledger/l3').set({ delta: 5, reason: 'vault_win' });
    await src.doc('classes/c1/teams/t1').update({ totalPoints: 12 });
    await src
      .doc('sessions/s2')
      .set({ classId: 'c1', instructorId: 'uid-antigo-ana', phase: 'end' });
    await call(adminImport, { confirm: 'COPIAR' }, { token: chefeToken });
    const team = (await db.doc('classes/c1/teams/t1').get()).data();
    expect(team?.totalPoints).toBe(15); // 7 + 3 + 5, sem contar o 7 duas vezes
    expect((await db.collection('classes/c1/teams/t1/ledger').get()).size).toBe(3);
    // a dourada da origem vence a normal do destino; a carta do ep2 (só no destino) fica
    expect(team?.cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ episodeId: 'ep1', variant: 'dourada' }),
        expect.objectContaining({ episodeId: 'ep2' }),
      ]),
    );
    expect((await db.doc('sessions/s2').get()).exists).toBe(true);
    expect((await db.collection('classes/c1/teams').get()).size).toBe(1);
  });

  it('a Narradora que entra depois ganha a turma na importação seguinte', async () => {
    await call(adminImport, { confirm: 'COPIAR' }, { token: chefeToken });
    const zoe = await googleToken('zoe@teste.br');
    const r = await call(adminImport, { confirm: 'COPIAR' }, { token: chefeToken });
    expect(r.body.unmapped).toEqual([]);
    expect((await db.doc('classes/c2').get()).data()?.instructorId).toBe(zoe.uid);
  });
});

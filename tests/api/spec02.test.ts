/**
 * SPEC-02 Parte A contra os emuladores: limpeza de sessões antigas (A3) e encerrar temporada (A4).
 * Critérios: limpeza apaga sessões antigas e subcoleções sem mexer no ranking; encerrar exige o
 * nome da turma; turma arquivada não abre sessão.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp as initClient, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth as getClientAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { getAdmin } from '../../api/_lib/admin';
import adminCleanup from '../../api/admin-cleanup';
import sessionOpen from '../../api/session-open';
import teamCreate from '../../api/team-create';
import seasonClose from '../../api/season-close';

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
let biaToken = '';
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

const AVATAR = { skin: 2, hair: 3, hairColor: 1, eyes: 2, mouth: 1, accessory: 0 };

async function clearAll() {
  for (const col of ['sessions', 'classes', 'rateLimits', 'auditLog']) {
    await db.recursiveDelete(db.collection(col));
  }
}

beforeAll(async () => {
  clientApp = initClient(
    { apiKey: 'demo', projectId: 'demo-cacada', appId: 'demo' },
    'api-tests-spec02',
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
  biaToken = (await googleToken('bia@teste.br')).token;
  chefeToken = (await googleToken('chefe@teste.br')).token;
});

afterAll(async () => {
  await deleteApp(clientApp);
});

let classId = '';
async function newClassAndSession(): Promise<string> {
  const ref = await db.collection('classes').add({
    schoolId: 'cavazza',
    instructorId: anaUid,
    name: '6º A',
    grade: 6,
    level: 'B',
    shift: 'manha',
    season: '2026-T4',
    archived: false,
    createdAt: new Date(),
  });
  classId = ref.id;
  const r = await call(sessionOpen, { classId, episodeId: 'ep1' }, { token: anaToken });
  expect(r.status).toBe(200);
  return r.body.code as string;
}

const create = (code: string, cityName: string, pirateName: string, pin = '1234') =>
  call(teamCreate, { code, cityName, pirateName, avatar: AVATAR, pin });

beforeEach(async () => {
  await clearAll();
});

const DAY = 86_400_000;
async function oldSession(id: string, daysAgo: number) {
  const ref = db.doc(`sessions/${id}`);
  await ref.set({
    classId,
    instructorId: anaUid,
    status: 'finished',
    expiresAt: Timestamp.fromMillis(Date.now() - daysAgo * DAY),
  });
  await ref.collection('players').doc('t1').set({ teamId: 't1' });
  await ref.collection('feed').doc('f1').set({ text: 'oi' });
  return ref;
}

describe('limpar sessões antigas (SPEC-02 A3)', () => {
  it('SPEC-02 F2: o resumo do relatório sobrevive à limpeza', async () => {
    await newClassAndSession();
    const ref = await oldSession('velha', 40);
    await ref.update({ episodeId: 'ep2', phase: 'end' });
    await ref.collection('players').doc('t1').set({ teamId: 't1', side: 'red', mode: 'pessoas' });
    const at = { episodeId: 'ep2', level: 'B', side: 'red', hintLevel: 0 };
    await ref
      .collection('attempts')
      .add({
        ...at,
        teamId: 't1',
        challengeKey: 'red-lock1',
        correct: false,
        msSinceChallengeStart: 20000,
      });
    await ref
      .collection('attempts')
      .add({
        ...at,
        teamId: 't1',
        challengeKey: 'red-lock1',
        correct: true,
        msSinceChallengeStart: 45000,
      });
    expect(
      (await call(adminCleanup, { scope: 'sessions' }, { token: anaToken })).body.deleted,
    ).toBe(1);
    expect((await db.collection('sessions/velha/attempts').get()).size).toBe(0);
    const rep = (await db.doc(`classes/${classId}/reports/ep2`).get()).data();
    expect(rep?.teams).toBe(1);
    expect(rep?.attempts).toBe(2);
    expect(rep?.challenges[0]).toMatchObject({
      challengeKey: 'red-lock1',
      firstTry: 0,
      avgAttempts: 2,
      avgSeconds: 45,
    });
  });

  it('apaga só as vencidas há mais de 30 dias, com as subcoleções, sem mexer nos pontos', async () => {
    await newClassAndSession();
    const team = (
      await create(
        (await db.collection('sessions').get()).docs[0]!.data().code as string,
        'Recife',
        'Maré Alta',
      )
    ).body.teamId as string;
    await db.doc(`classes/${classId}/teams/${team}`).update({ totalPoints: 7 });
    await oldSession('velha', 40);
    await oldSession('recente', 10);
    const r = await call(adminCleanup, { scope: 'sessions' }, { token: anaToken });
    expect(r.status).toBe(200);
    expect(r.body.deleted).toBe(1);
    expect((await db.doc('sessions/velha').get()).exists).toBe(false);
    expect((await db.collection('sessions/velha/players').get()).size).toBe(0);
    expect((await db.collection('sessions/velha/feed').get()).size).toBe(0);
    expect((await db.doc('sessions/recente').get()).exists).toBe(true);
    expect((await db.doc(`classes/${classId}/teams/${team}`).get()).data()?.totalPoints).toBe(7);
    const audit = (await db.collection('auditLog').get()).docs.map((d) => d.data());
    expect(audit.some((a) => a.action === 'cleanup-sessions' && a.deleted === 1)).toBe(true);
  });

  it('a Narradora não apaga sessões de outra; a admin apaga todas', async () => {
    await newClassAndSession();
    await oldSession('velha', 40);
    expect(
      (await call(adminCleanup, { scope: 'sessions' }, { token: biaToken })).body.deleted,
    ).toBe(0);
    expect((await db.doc('sessions/velha').get()).exists).toBe(true);
    expect(
      (await call(adminCleanup, { scope: 'sessions' }, { token: chefeToken })).body.deleted,
    ).toBe(1);
  });

  it('sem login ou escopo errado, nada', async () => {
    expect((await call(adminCleanup, { scope: 'sessions' })).status).toBe(401);
    expect((await call(adminCleanup, { scope: 'tudo' }, { token: anaToken })).status).toBe(400);
  });
});

describe('encerrar temporada (SPEC-02 A4)', () => {
  it('exige o nome da turma, apaga duplas, ledger, PINs e sessões e arquiva', async () => {
    const code = await newClassAndSession();
    const team = (await create(code, 'Recife', 'Maré Alta')).body.teamId as string;
    await db.collection(`classes/${classId}/teams/${team}/ledger`).add({ delta: 3 });
    expect(
      (await call(seasonClose, { classId, confirmName: 'outra' }, { token: anaToken })).status,
    ).toBe(400);
    expect(
      (await call(seasonClose, { classId, confirmName: '6º A' }, { token: biaToken })).status,
    ).toBe(403);
    const r = await call(seasonClose, { classId, confirmName: ' 6º a ' }, { token: anaToken });
    expect(r.status).toBe(200);
    expect(r.body.teams).toBe(1);
    expect((await db.collection(`classes/${classId}/teams`).get()).size).toBe(0);
    expect((await db.collection(`classes/${classId}/teams/${team}/ledger`).get()).size).toBe(0);
    expect((await db.doc(`classes/${classId}/teams/${team}/private/auth`).get()).exists).toBe(
      false,
    );
    expect((await db.collection('sessions').where('classId', '==', classId).get()).size).toBe(0);
    const cls = (await db.doc(`classes/${classId}`).get()).data();
    expect(cls?.archived).toBe(true);
    expect(cls?.seasonClosedAt).toBeDefined();
    const audit = (await db.collection('auditLog').get()).docs.map((d) => d.data());
    expect(
      audit.some((a) => a.action === 'season-close' && a.classId === classId && !('cityName' in a)),
    ).toBe(true);
  });

  it('turma arquivada não abre sessão (SPEC-02 A2)', async () => {
    await newClassAndSession();
    await db.recursiveDelete(db.collection('sessions'));
    await db.doc(`classes/${classId}`).update({ archived: true });
    expect(
      (await call(sessionOpen, { classId, episodeId: 'ep1' }, { token: anaToken })).status,
    ).toBe(409);
  });
});

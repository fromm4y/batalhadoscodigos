/**
 * Rotas da API da Etapa 2 rodando contra os emuladores (Firestore + Auth).
 * Critérios: duplas entram com o código; nomes usados ficam bloqueados; PIN errado 5 vezes
 * bloqueia por 60 s; reset de PIN funciona; sem sessão aberta, ninguém entra.
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
import joinSession from '../../api/join-session';
import sessionOpen from '../../api/session-open';
import teamCreate from '../../api/team-create';
import teamLogin from '../../api/team-login';
import teamResetPin from '../../api/team-reset-pin';

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
  for (const col of ['sessions', 'classes', 'rateLimits']) {
    await db.recursiveDelete(db.collection(col));
  }
}

beforeAll(async () => {
  clientApp = initClient({ apiKey: 'demo', projectId: 'demo-cacada', appId: 'demo' }, 'api-tests');
  connectAuthEmulator(getClientAuth(clientApp), 'http://127.0.0.1:9099', { disableWarnings: true });
  for (const email of ['ana@teste.br', 'bia@teste.br']) {
    await db.doc(`allowedInstructors/${email}`).set({
      email,
      role: 'instructor',
      active: true,
      addedBy: 'teste',
      addedAt: new Date(),
    });
  }
  const ana = await googleToken('ana@teste.br');
  anaToken = ana.token;
  anaUid = ana.uid;
  biaToken = (await googleToken('bia@teste.br')).token;
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

describe('abrir sessão (RN-03, RN-04)', () => {
  it('gera código e devolve a mesma sessão se já houver uma aberta', async () => {
    const code = await newClassAndSession();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    const again = await call(sessionOpen, { classId, episodeId: 'ep1' }, { token: anaToken });
    expect(again.body.code).toBe(code);
    expect(again.body.existing).toBe(true);
  });

  it('outra Narradora não abre sessão na turma alheia; sem login, nada', async () => {
    await newClassAndSession();
    expect(
      (await call(sessionOpen, { classId, episodeId: 'ep1' }, { token: biaToken })).status,
    ).toBe(403);
    expect((await call(sessionOpen, { classId, episodeId: 'ep1' })).status).toBe(401);
  });

  it('rejeita episódio indisponível', async () => {
    await newClassAndSession();
    const r = await call(sessionOpen, { classId, episodeId: 'ep2' }, { token: anaToken });
    expect(r.status).toBe(400);
  });
});

describe('entrar com o código', () => {
  it('código inexistente → "A Narradora ainda não deu o sinal"', async () => {
    const r = await call(joinSession, { code: 'ZZZZ' });
    expect(r.status).toBe(404);
    expect(r.body.error).toContain('A Narradora ainda não deu o sinal');
  });

  it('sessão encerrada ou vencida não aceita ninguém', async () => {
    const code = await newClassAndSession();
    const s = await db.collection('sessions').where('code', '==', code).get();
    await s.docs[0]!.ref.update({ expiresAt: Timestamp.fromMillis(Date.now() - 1000) });
    expect((await call(joinSession, { code })).status).toBe(404);
    await s.docs[0]!.ref.update({
      expiresAt: Timestamp.fromMillis(Date.now() + 3600_000),
      status: 'finished',
    });
    expect((await call(joinSession, { code })).status).toBe(404);
    expect((await create(code, 'Recife', 'Maré Alta')).status).toBe(404);
  });

  it('duas duplas entram com o código; nomes usados ficam bloqueados', async () => {
    const code = await newClassAndSession();
    const j1 = await call(joinSession, { code: code.toLowerCase() });
    expect(j1.status).toBe(200);
    expect(j1.body.level).toBe('B');
    expect(j1.body.teams).toEqual([]);

    const a = await create(code, 'Recife', 'Maré Alta');
    expect(a.status).toBe(200);
    expect(typeof a.body.customToken).toBe('string');
    const b = await create(code, 'Natal', 'Pérola Azul', '9876');
    expect(b.status).toBe(200);

    const j2 = await call(joinSession, { code });
    expect((j2.body.teams as unknown[]).length).toBe(2);
    expect(j2.body.takenNames).toEqual({
      cities: ['Recife', 'Natal'],
      pirates: ['Maré Alta', 'Pérola Azul'],
    });
    expect(JSON.stringify(j2.body)).not.toMatch(/pinHash|1234|scrypt/);

    expect((await create(code, 'Recife', 'Polvo Sabido')).body.code).toBe('city_taken');
    expect((await create(code, 'Manaus', 'Pérola Azul')).body.code).toBe('pirate_taken');

    // jogador criado na sessão, PIN só como hash
    const teamId = a.body.teamId as string;
    const privateAuth = await db.doc(`classes/${classId}/teams/${teamId}/private/auth`).get();
    expect(privateAuth.data()?.pinHash).toMatch(/^scrypt\$/);
    const sessionId = j2.body.sessionId as string;
    const player = await db.doc(`sessions/${sessionId}/players/${teamId}`).get();
    expect(player.data()?.uid).toBe(`team_${teamId}_${sessionId}`);
    expect(player.data()?.progress.lockIndex).toBe(0);
  });

  it('rejeita nome fora da lista, avatar inválido e PIN que não tem 4 dígitos', async () => {
    const code = await newClassAndSession();
    expect((await create(code, 'Gotham', 'Maré Alta')).status).toBe(400);
    expect((await create(code, 'Recife', 'Maré Alta', '12')).status).toBe(400);
    const bad = await call(teamCreate, {
      code,
      cityName: 'Recife',
      pirateName: 'Maré Alta',
      avatar: { ...AVATAR, skin: 9 },
      pin: '1234',
    });
    expect(bad.status).toBe(400);
  });

  it('turma com 10 duplas não aceita a 11ª (RN-02)', async () => {
    const code = await newClassAndSession();
    const cities = [
      'Manaus',
      'Recife',
      'Floripa',
      'Barueri',
      'Salvador',
      'Belém',
      'Natal',
      'Cuiabá',
      'Curitiba',
      'Fortaleza',
      'Goiânia',
    ];
    const pirates = [
      'Tubarão Risonho',
      'Âncora Dourada',
      'Olho de Coral',
      'Barba de Algas',
      'Gaivota Veloz',
      'Polvo Sabido',
      'Canhão Gentil',
      'Maré Alta',
      'Bússola Torta',
      'Concha Brilhante',
      'Tempestade Mansa',
    ];
    for (let i = 0; i < 10; i++)
      expect((await create(code, cities[i]!, pirates[i]!)).status).toBe(200);
    const extra = await create(code, cities[10]!, pirates[10]!);
    expect(extra.status).toBe(409);
    expect(extra.body.code).toBe('class_full');
  });
});

describe('PIN (RN-52)', () => {
  it('PIN certo entra; 5 erros seguidos bloqueiam por 60 s, até com o PIN certo', async () => {
    const code = await newClassAndSession();
    const teamId = (await create(code, 'Recife', 'Maré Alta', '1234')).body.teamId as string;
    expect((await call(teamLogin, { code, teamId, pin: '1234' })).status).toBe(200);

    for (let left = 4; left >= 1; left--) {
      const r = await call(teamLogin, { code, teamId, pin: '0000' });
      expect(r.status).toBe(401);
      expect(r.body.attemptsLeft).toBe(left);
    }
    const fifth = await call(teamLogin, { code, teamId, pin: '0000' });
    expect(fifth.status).toBe(423);
    expect(fifth.body.secondsLeft).toBe(60);
    const blocked = await call(teamLogin, { code, teamId, pin: '1234' });
    expect(blocked.status).toBe(423);

    // passado o bloqueio, o PIN certo volta a funcionar
    await db
      .doc(`classes/${classId}/teams/${teamId}/private/auth`)
      .update({ lockedUntil: Timestamp.fromMillis(Date.now() - 1) });
    expect((await call(teamLogin, { code, teamId, pin: '1234' })).status).toBe(200);
  });

  it('acerto zera a contagem de erros', async () => {
    const code = await newClassAndSession();
    const teamId = (await create(code, 'Recife', 'Maré Alta', '1234')).body.teamId as string;
    for (let i = 0; i < 4; i++) await call(teamLogin, { code, teamId, pin: '0000' });
    expect((await call(teamLogin, { code, teamId, pin: '1234' })).status).toBe(200);
    expect((await call(teamLogin, { code, teamId, pin: '0000' })).body.attemptsLeft).toBe(4);
  });

  it('reset de PIN: só a dona da turma; a dupla define um novo no próximo login', async () => {
    const code = await newClassAndSession();
    const teamId = (await create(code, 'Recife', 'Maré Alta', '1234')).body.teamId as string;

    expect((await call(teamResetPin, { classId, teamId }, { token: biaToken })).status).toBe(403);
    expect((await call(teamResetPin, { classId, teamId })).status).toBe(401);
    expect((await call(teamResetPin, { classId, teamId }, { token: anaToken })).status).toBe(200);

    const join = await call(joinSession, { code });
    expect((join.body.teams as { needsNewPin: boolean }[])[0]!.needsNewPin).toBe(true);

    const first = await call(teamLogin, { code, teamId, pin: '5555' });
    expect(first.status).toBe(200);
    expect(first.body.newPin).toBe(true);
    expect((await call(teamLogin, { code, teamId, pin: '1234' })).status).toBe(401);
    expect((await call(teamLogin, { code, teamId, pin: '5555' })).status).toBe(200);
  });
});

describe('limite de códigos errados por IP', () => {
  it('30 códigos errados do mesmo IP bloqueiam por 1 min; códigos certos não contam', async () => {
    const code = await newClassAndSession();
    for (let i = 0; i < 40; i++) {
      expect((await call(joinSession, { code }, { ip: '200.1.1.1' })).status).toBe(200);
    }
    for (let i = 0; i < 30; i++) {
      expect((await call(joinSession, { code: 'ZZZZ' }, { ip: '200.1.1.1' })).status).toBe(404);
    }
    expect((await call(joinSession, { code }, { ip: '200.1.1.1' })).status).toBe(429);
    expect((await call(joinSession, { code }, { ip: '200.1.1.2' })).status).toBe(200);
  });
});

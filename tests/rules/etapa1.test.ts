/**
 * Regras do Firestore — Etapa 1 (instrutores, admin e turmas).
 * Critérios de aceite: e-mail fora da allowlist não entra; instrutor A não vê turma do B;
 * admin adiciona instrutor e ele consegue entrar.
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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const ADMIN = { uid: 'admin-uid', email: 'admin@escola.br' };
const ANA = { uid: 'ana-uid', email: 'ana@escola.br' };
const BIA = { uid: 'bia-uid', email: 'bia@escola.br' };
const INTRUSO = { uid: 'x-uid', email: 'intruso@gmail.com' };

let env: RulesTestEnvironment;

function asGoogle(user: { uid: string; email: string }): Firestore {
  return env
    .authenticatedContext(user.uid, {
      email: user.email,
      email_verified: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .firestore() as unknown as Firestore;
}

function asTeam(): Firestore {
  return env
    .authenticatedContext('team_t1_s1', {
      role: 'team',
      teamId: 't1',
      classId: 'turma-ana',
      sessionId: 's1',
      firebase: { sign_in_provider: 'custom' },
    })
    .firestore() as unknown as Firestore;
}

const turma = (instructorId: string, extra: Record<string, unknown> = {}) => ({
  schoolId: 'cavazza',
  instructorId,
  name: '6º A',
  grade: 6,
  level: 'B',
  shift: 'manha',
  season: '2026-T4',
  archived: false,
  createdAt: serverTimestamp(),
  ...extra,
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-cacada',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const allow = (email: string, role: string, active = true) =>
      setDoc(doc(db, 'allowedInstructors', email), {
        email,
        role,
        active,
        addedBy: 'seed',
        addedAt: new Date(),
      });
    await allow(ADMIN.email, 'admin');
    await allow(ANA.email, 'instructor');
    await allow(BIA.email, 'instructor');
    await setDoc(doc(db, 'schools', 'cavazza'), { name: 'Cavazza', active: true });
    await setDoc(doc(db, 'classes', 'turma-ana'), { ...turma(ANA.uid), createdAt: new Date() });
    await setDoc(doc(db, 'classes', 'turma-bia'), { ...turma(BIA.uid), createdAt: new Date() });
  });
});

describe('allowlist', () => {
  it('e-mail fora da allowlist não lê escolas nem turmas', async () => {
    const db = asGoogle(INTRUSO);
    await assertFails(getDocs(collection(db, 'schools')));
    await assertFails(getDoc(doc(db, 'classes', 'turma-ana')));
  });

  it('intruso consegue checar o próprio e-mail (para o app mostrar "peça acesso")', async () => {
    await assertSucceeds(getDoc(doc(asGoogle(INTRUSO), 'allowedInstructors', INTRUSO.email)));
  });

  it('intruso não consegue criar o próprio acesso nem o perfil', async () => {
    const db = asGoogle(INTRUSO);
    await assertFails(
      setDoc(doc(db, 'allowedInstructors', INTRUSO.email), {
        email: INTRUSO.email,
        role: 'admin',
        active: true,
        addedBy: 'eu',
        addedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, 'instructors', INTRUSO.uid), {
        uid: INTRUSO.uid,
        email: INTRUSO.email,
        displayName: 'X',
        role: 'instructor',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('instrutor não lê a allowlist dos outros nem se promove a admin', async () => {
    const db = asGoogle(ANA);
    await assertFails(getDoc(doc(db, 'allowedInstructors', BIA.email)));
    await assertFails(updateDoc(doc(db, 'allowedInstructors', ANA.email), { role: 'admin' }));
  });

  it('admin adiciona instrutor e ele consegue entrar', async () => {
    const nova = { uid: 'nova-uid', email: 'nova@escola.br' };
    await assertFails(getDocs(collection(asGoogle(nova), 'schools')));
    await assertSucceeds(
      setDoc(doc(asGoogle(ADMIN), 'allowedInstructors', nova.email), {
        email: nova.email,
        role: 'instructor',
        active: true,
        addedBy: ADMIN.email,
        addedAt: serverTimestamp(),
      }),
    );
    const db = asGoogle(nova);
    await assertSucceeds(getDocs(collection(db, 'schools')));
    await assertSucceeds(
      setDoc(doc(db, 'instructors', nova.uid), {
        uid: nova.uid,
        email: nova.email,
        displayName: 'Nova',
        role: 'instructor',
        createdAt: serverTimestamp(),
      }),
    );
  });

  it('instrutor desativado perde o acesso', async () => {
    await assertSucceeds(
      updateDoc(doc(asGoogle(ADMIN), 'allowedInstructors', ANA.email), { active: false }),
    );
    await assertFails(getDoc(doc(asGoogle(ANA), 'classes', 'turma-ana')));
  });

  it('admin não pode se desativar nem se rebaixar', async () => {
    const db = asGoogle(ADMIN);
    await assertFails(updateDoc(doc(db, 'allowedInstructors', ADMIN.email), { active: false }));
    await assertFails(
      updateDoc(doc(db, 'allowedInstructors', ADMIN.email), { role: 'instructor' }),
    );
  });

  it('perfil não pode declarar papel diferente da allowlist', async () => {
    await assertFails(
      setDoc(doc(asGoogle(ANA), 'instructors', ANA.uid), {
        uid: ANA.uid,
        email: ANA.email,
        displayName: 'Ana',
        role: 'admin',
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('turmas', () => {
  it('instrutor A não vê turma do instrutor B', async () => {
    const db = asGoogle(ANA);
    await assertSucceeds(getDoc(doc(db, 'classes', 'turma-ana')));
    await assertFails(getDoc(doc(db, 'classes', 'turma-bia')));
  });

  it('lista só as próprias turmas (consulta filtrada)', async () => {
    const db = asGoogle(ANA);
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'classes'),
          where('instructorId', '==', ANA.uid),
          where('archived', '==', false),
        ),
      ),
    );
    await assertFails(getDocs(collection(db, 'classes')));
  });

  it('admin lê todas as turmas, mas não edita a turma de outra pessoa', async () => {
    const db = asGoogle(ADMIN);
    await assertSucceeds(getDocs(collection(db, 'classes')));
    await assertFails(updateDoc(doc(db, 'classes', 'turma-ana'), { name: 'Hackeada' }));
  });

  it('instrutor cria turma própria válida', async () => {
    await assertSucceeds(setDoc(doc(asGoogle(ANA), 'classes', 'nova'), turma(ANA.uid)));
  });

  it('não cria turma em nome de outra pessoa', async () => {
    await assertFails(setDoc(doc(asGoogle(ANA), 'classes', 'nova'), turma(BIA.uid)));
  });

  it('rejeita série, nível, turno ou escola inválidos', async () => {
    const db = asGoogle(ANA);
    await assertFails(setDoc(doc(db, 'classes', 'n1'), turma(ANA.uid, { grade: 3 })));
    await assertFails(setDoc(doc(db, 'classes', 'n2'), turma(ANA.uid, { level: 'D' })));
    await assertFails(setDoc(doc(db, 'classes', 'n3'), turma(ANA.uid, { shift: 'noite' })));
    await assertFails(setDoc(doc(db, 'classes', 'n4'), turma(ANA.uid, { schoolId: 'nao-existe' })));
    await assertFails(setDoc(doc(db, 'classes', 'n5'), turma(ANA.uid, { name: '' })));
    await assertFails(setDoc(doc(db, 'classes', 'n6'), turma(ANA.uid, { extra: 'x' })));
  });

  it('edita e arquiva a própria turma, mas não apaga nem passa para outra pessoa', async () => {
    const db = asGoogle(ANA);
    await assertSucceeds(updateDoc(doc(db, 'classes', 'turma-ana'), { name: '6º B' }));
    await assertSucceeds(updateDoc(doc(db, 'classes', 'turma-ana'), { archived: true }));
    await assertFails(updateDoc(doc(db, 'classes', 'turma-ana'), { instructorId: BIA.uid }));
    await assertFails(deleteDoc(doc(db, 'classes', 'turma-ana')));
  });

  it('dupla sem sessão válida não acessa turma nem escolas', async () => {
    const db = asTeam();
    await assertFails(getDoc(doc(db, 'classes', 'turma-ana')));
    await assertFails(getDocs(collection(db, 'schools')));
  });
});

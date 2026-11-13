import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { GAME_RULES } from '../../src/config/gameRules.js';
import type { AvatarConfig, Level } from '../../src/types/domain.js';

export type OpenSession = {
  id: string;
  classId: string;
  instructorId: string;
  episodeId: string;
  code: string;
};

/** Sessão aberta e dentro do prazo (RN-04) com este código, ou null. */
export async function findOpenSessionByCode(
  db: Firestore,
  code: string,
): Promise<OpenSession | null> {
  const snap = await db
    .collection('sessions')
    .where('code', '==', code)
    .where('status', '==', 'open')
    .limit(5)
    .get();
  const now = Date.now();
  for (const d of snap.docs) {
    const s = d.data();
    const expiresAt = s.expiresAt as Timestamp | undefined;
    if (expiresAt && expiresAt.toMillis() > now) {
      return {
        id: d.id,
        classId: s.classId as string,
        instructorId: s.instructorId as string,
        episodeId: s.episodeId as string,
        code,
      };
    }
  }
  return null;
}

export type PublicTeam = {
  teamId: string;
  cityName: string;
  pirateName: string;
  avatar: AvatarConfig;
  /** PIN resetado pela Narradora: a dupla cria um novo no próximo login. */
  needsNewPin: boolean;
};

/** Duplas da turma (dados públicos, sem PIN). */
export async function listPublicTeams(db: Firestore, classId: string): Promise<PublicTeam[]> {
  const teams = await db.collection(`classes/${classId}/teams`).get();
  const auths = await Promise.all(
    teams.docs.map((t) => db.doc(`classes/${classId}/teams/${t.id}/private/auth`).get()),
  );
  return teams.docs
    .map((t, i) => {
      const d = t.data();
      return {
        teamId: t.id,
        cityName: d.cityName as string,
        pirateName: d.pirateName as string,
        avatar: d.avatar as AvatarConfig,
        needsNewPin: !auths[i]?.data()?.pinHash,
        createdMs: (d.createdAt as Timestamp | undefined)?.toMillis() ?? 0,
      };
    })
    .sort((a, b) => a.createdMs - b.createdMs)
    .map(({ createdMs: _c, ...t }) => t);
}

export async function classLevel(db: Firestore, classId: string): Promise<Level> {
  const cls = await db.doc(`classes/${classId}`).get();
  return (cls.data()?.level as Level | undefined) ?? 'B';
}

/** uid do custom token da dupla (SPEC 8.1). */
export function teamUid(teamId: string, sessionId: string): string {
  return `team_${teamId}_${sessionId}`;
}

/** Estado inicial da dupla na sessão (SPEC 6.1, players). */
export function initialPlayer(teamId: string, uid: string) {
  return {
    teamId,
    uid,
    side: null,
    matchId: null,
    connected: false,
    lastSeenAt: FieldValue.serverTimestamp(),
    progress: {
      lockIndex: 0,
      locksOpenedAt: [null, null, null],
      vaultSolvedAt: null,
      eventResult: 'pending',
      jailUntil: null,
      heardTransmission: false,
    },
    hints: {},
    helpUsed: false,
    abilities: { owned: [], used: [] },
    solvedCount: 0,
    episodePoints: 0,
    finishedAt: null,
  };
}

export function sessionExpiry(nowMs: number): Timestamp {
  return Timestamp.fromMillis(nowMs + GAME_RULES.session.expiresAfterHours * 3600 * 1000);
}

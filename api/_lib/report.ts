/**
 * SPEC-02 F2: o relatório sobrevive à limpeza. Antes de apagar sessões, o servidor guarda o resumo
 * de cada episódio da turma em `classes/{classId}/reports/{episodeId}` (só números).
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import {
  episodeReport,
  type Attempt,
  type MatchLite,
  type PlayerLite,
} from '../../src/engine/report.js';

export async function saveEpisodeReport(
  db: Firestore,
  classId: string,
  episodeId: string,
): Promise<boolean> {
  const all = await db.collection('sessions').where('classId', '==', classId).get();
  const sessions = all.docs.filter((d) => d.data().episodeId === episodeId);
  const attempts: Attempt[] = [];
  const players: PlayerLite[] = [];
  const matches: MatchLite[] = [];
  const helpByKey: Record<string, number> = {};
  for (const s of sessions) {
    const [a, p, m, h] = await Promise.all([
      s.ref.collection('attempts').get(),
      s.ref.collection('players').get(),
      s.ref.collection('matches').get(),
      s.ref.collection('helpRequests').get(),
    ]);
    attempts.push(...a.docs.map((d) => d.data() as Attempt));
    players.push(...p.docs.map((d) => d.data() as PlayerLite));
    matches.push(...m.docs.map((d) => d.data() as MatchLite));
    for (const d of h.docs) {
      const k = String(d.data().challengeKey ?? '');
      if (k) helpByKey[k] = (helpByKey[k] ?? 0) + 1;
    }
  }
  if (!attempts.length && !players.some((p) => p.side)) return false;
  const report = episodeReport({
    episodeId,
    sessions: sessions.length,
    attempts,
    players,
    matches,
    helpByKey,
  });
  await db
    .doc(`classes/${classId}/reports/${episodeId}`)
    .set({ ...report, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

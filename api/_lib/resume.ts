/**
 * "Continuar a aula anterior" (pedido da May, 17/11): a sessão nova do MESMO episódio pode
 * retomar de onde cada dupla parou. Função pura: do jogador da sessão anterior, o que volta.
 * Recomeçam: confronto e barra (a turma presente pode ser outra), transmissão ouvida (a
 * Narradora transmite de novo), pedido de ajuda e prisão.
 */
import type { Firestore } from 'firebase-admin/firestore';

type Obj = Record<string, unknown>;

export function resumeFields(prev: Obj): Obj {
  const p = (prev.progress ?? {}) as Obj;
  const pick = (k: string) => (prev[k] === undefined ? {} : { [k]: prev[k] });
  return {
    side: prev.side ?? null,
    mode: prev.mode ?? null,
    progress: {
      lockIndex: p.lockIndex ?? 0,
      locksOpenedAt: p.locksOpenedAt ?? [null, null, null],
      vaultSolvedAt: p.vaultSolvedAt ?? null,
      eventResult: p.eventResult ?? 'pending',
      jailUntil: null,
      heardTransmission: false,
      step: p.step ?? 0,
      vaultStep: p.vaultStep ?? 0,
    },
    hints: prev.hints ?? {},
    abilities: prev.abilities ?? { owned: [], used: [] },
    solvedCount: prev.solvedCount ?? 0,
    episodePoints: prev.episodePoints ?? 0,
    ...pick('misses'),
    ...pick('bonusSolvedAt'),
    ...pick('equippedCard'),
    ...pick('cardUses'),
    ...pick('cardBoost'),
    resumed: true,
  };
}

/** Última sessão da turma com este episódio que saiu do lobby (a aula que vai ser retomada). */
export async function lastSessionOfEpisode(
  db: Firestore,
  classId: string,
  episodeId: string,
): Promise<string | null> {
  const snap = await db.collection('sessions').where('classId', '==', classId).get();
  const same = snap.docs
    .filter((d) => d.data().episodeId === episodeId && d.data().phase && d.data().phase !== 'lobby')
    .sort(
      (a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0),
    );
  return same[0]?.id ?? null;
}

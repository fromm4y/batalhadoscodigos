import { doc, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { useEffect } from 'react';
import { GAME_RULES } from '@/config/gameRules';
import { getFirebase, type FirebaseRole } from '@/lib/firebase';
import { serverNow } from '@/lib/serverClock';
import type { SessionDoc } from '@/types/domain';

/**
 * SPEC-02 A1 — eleição por transação: qualquer cliente conectado (dupla, painel ou projetor)
 * tenta disparar o evento automático; só passa quem chega primeiro depois do horário sorteado.
 * Os outros desistem em silêncio. Não depende mais da aba do painel aberta.
 */
export async function tryAutoMuseumEvent(fdb: Firestore, sessionId: string): Promise<boolean> {
  return runTransaction(fdb, async (tx) => {
    const ref = doc(fdb, 'sessions', sessionId);
    const s = (await tx.get(ref)).data() as SessionDoc | undefined;
    if (!s || s.phase !== 'locks' || s.museumEvent?.status !== 'idle' || s.freeze?.active)
      return false;
    const at = s.autoEventAt?.toMillis();
    if (!at || serverNow() < at) return false;
    tx.update(ref, {
      museumEvent: { status: 'running', startedAt: serverTimestamp(), triggeredBy: 'auto' },
    });
    return true;
  });
}

/** Liga a eleição enquanto a sessão está nos cadeados com o evento ainda por acontecer. */
export function useMuseumEventElection(
  role: FirebaseRole,
  sessionId: string,
  session: Pick<SessionDoc, 'phase' | 'museumEvent' | 'autoEventAt'> | null,
) {
  const armed =
    !!session &&
    session.phase === 'locks' &&
    session.museumEvent?.status === 'idle' &&
    !!session.autoEventAt;
  // Economia (23/11): só abre a transação depois do horário sorteado (antes, 1 consulta a cada
  // poucos segundos em cada tela, a aula inteira).
  const at = session?.autoEventAt?.toMillis?.() ?? null;
  useEffect(() => {
    if (!armed || at === null) return;
    const { db } = getFirebase(role);
    const tick = () => {
      if (serverNow() < at) return;
      void tryAutoMuseumEvent(db, sessionId).catch(() => undefined);
    };
    tick();
    const t = setInterval(tick, GAME_RULES.museumEvent.electionCheckSeconds * 1000);
    return () => clearInterval(t);
  }, [armed, at, role, sessionId]);
}

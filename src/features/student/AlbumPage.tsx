import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { HalftoneBackground, SpeechBubble } from '@/components/comic';
import { CollectibleCard } from '@/components/game/CollectibleCard';
import { BadgeRow, StampRow } from '@/components/game/TeamRecord';
import { BrassFrame, Spotlights } from '@/components/scene';
import { seasonEpisodes } from '@/content/season';
import { albumSlot } from '@/engine/cards';
import { usesLabel } from '@/features/game/cardLabels';
import { useSeasonOrder } from '@/features/game/useEpisodeHook';
import { useSeasonCards } from '@/features/game/useSeasonCards';
import { getFirebase } from '@/lib/firebase';
import type { SessionDoc, TeamDoc } from '@/types/domain';
import { NoSignalScreen } from './NoSignalScreen';
import { useTeamAuth, type TeamClaims } from './useTeamAuth';

/**
 * `/album` — Álbum do Museu (SPEC-02 C2 + pedido da May, 16/11): uma figurinha por episódio
 * da temporada. Ganha (dourada se venceu), hoje, futura (trancada) ou perdida (faltou).
 * Cada carta ganha tem um poder para usar nos outros episódios e o certificado do episódio.
 */
export function AlbumPage() {
  const auth = useTeamAuth();
  if (auth.status === 'loading') return <HalftoneBackground>{null}</HalftoneBackground>;
  if (auth.status === 'none') return <NoSignalScreen />;
  return <Album claims={auth.claims} />;
}

function Album({ claims }: { claims: TeamClaims }) {
  const [team, setTeam] = useState<TeamDoc | null>(null);
  const [session, setSession] = useState<SessionDoc | null>(null);
  const order = useSeasonOrder('student');
  const info = useSeasonCards();

  useEffect(() => {
    const { db } = getFirebase('student');
    const a = onSnapshot(
      doc(db, 'classes', claims.classId, 'teams', claims.teamId),
      (s) => setTeam((s.data() as TeamDoc | undefined) ?? null),
      () => setTeam(null),
    );
    const b = onSnapshot(
      doc(db, 'sessions', claims.sessionId),
      (s) => setSession((s.data() as SessionDoc | undefined) ?? null),
      () => setSession(null),
    );
    return () => {
      a();
      b();
    };
  }, [claims]);

  const played = session?.history?.played ?? [];
  const today = session?.phase === 'end' ? undefined : session?.episodeId;
  const owned = team?.cards?.length ?? 0;
  const eps = seasonEpisodes(order);

  return (
    <HalftoneBackground>
      <Spotlights intensity={0.08} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-3 px-4 py-4 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heist text-5xl tracking-[0.12em] text-brass text-glow-brass">
              🃏 ÁLBUM DO MUSEU
            </h1>
            <p className="font-type text-mist">
              {team ? `${team.cityName} · ${team.pirateName} · ` : ''}
              {owned} de {eps.length} cartas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/certificado-temporada"
              className="grid min-h-11 place-items-center border-[3px] border-ink bg-paper px-4 pt-1 font-heist text-xl tracking-wider text-ink hover:glow-brass"
            >
              🏆 Certificado da temporada
            </Link>
            <Link
              to="/jogo"
              className="grid min-h-11 place-items-center border-[3px] border-ink bg-brass px-4 pt-1 font-heist text-xl tracking-wider text-ink"
            >
              ← Voltar para a missão
            </Link>
          </div>
        </header>

        {team && (team.stamps?.length || team.badges?.length) ? (
          <div className="flex flex-wrap items-center gap-4" aria-label="Ficha da dupla">
            <StampRow stamps={team.stamps} />
            <BadgeRow badges={team.badges} onDark />
          </div>
        ) : null}
        <BrassFrame className="bg-graphite/80">
          {!info || !team ? (
            <p className="p-6 text-center font-type text-mist">Abrindo o álbum...</p>
          ) : (
            <ul className="flex flex-wrap justify-center gap-5" aria-label="Cartas da temporada">
              {eps.map((e) => {
                const meta = info[e.id];
                if (!meta) return null;
                const slot = albumSlot(e.id, team.cards, played, today);
                const card = team.cards?.find((c) => c.episodeId === e.id);
                return (
                  <li key={e.id} className="flex flex-col items-center gap-2">
                    <CollectibleCard
                      card={meta.card}
                      number={meta.number}
                      slot={slot}
                      usesLabel={card ? usesLabel(card) : undefined}
                    />
                    {card && (
                      <Link
                        to={`/certificado/${e.id}`}
                        className="grid min-h-11 place-items-center border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider text-ink hover:glow-brass"
                      >
                        🎓 Certificado
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </BrassFrame>

        <SpeechBubble who="narradora" tail="left" compact className="max-w-none">
          Cada carta tem um <strong>poder</strong>: no planejamento, levem UMA carta para a missão e
          usem durante o jogo. A <strong>★ dourada</strong> é rara (só para quem venceu o confronto)
          e vale mais usos. Carta perdida não volta: não faltem! 😉
        </SpeechBubble>
      </main>
    </HalftoneBackground>
  );
}

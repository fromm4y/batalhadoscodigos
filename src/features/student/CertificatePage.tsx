import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ComicButton } from '@/components/comic';
import { KnowledgeCertificate } from '@/components/game/KnowledgeCertificate';
import { useSeasonCards } from '@/features/game/useSeasonCards';
import { getFirebase } from '@/lib/firebase';
import type { ClassDoc, TeamDoc } from '@/types/domain';
import { NoSignalScreen } from './NoSignalScreen';
import { useTeamAuth, type TeamClaims } from './useTeamAuth';

/** `/certificado/:episodeId` — certificado de conhecimento da dupla, para imprimir (16/11). */
export function CertificatePage() {
  const auth = useTeamAuth();
  if (auth.status === 'loading') return null;
  if (auth.status === 'none') return <NoSignalScreen />;
  return <Certificate claims={auth.claims} />;
}

function Certificate({ claims }: { claims: TeamClaims }) {
  const { episodeId = '' } = useParams();
  const info = useSeasonCards();
  const [team, setTeam] = useState<TeamDoc | null>(null);
  const [cls, setCls] = useState<ClassDoc | null>(null);
  useEffect(() => {
    const { db } = getFirebase('student');
    const a = onSnapshot(doc(db, 'classes', claims.classId, 'teams', claims.teamId), (s) =>
      setTeam((s.data() as TeamDoc | undefined) ?? null),
    );
    const b = onSnapshot(doc(db, 'classes', claims.classId), (s) =>
      setCls((s.data() as ClassDoc | undefined) ?? null),
    );
    return () => {
      a();
      b();
    };
  }, [claims]);

  const ep = info?.[episodeId];
  const card = team?.cards?.find((c) => c.episodeId === episodeId);

  return (
    <div className="min-h-screen bg-night px-4 py-6 print:bg-white print:p-0">
      <nav className="no-print mx-auto mb-4 flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <Link
          to="/album"
          className="grid min-h-11 place-items-center border-[3px] border-ink bg-graphite-light px-4 pt-1 font-heist text-xl tracking-wider text-paper"
        >
          ← Álbum
        </Link>
        {ep && team && card && (
          <ComicButton variant="brass" icon="🖨️" onClick={() => window.print()}>
            Imprimir certificado
          </ComicButton>
        )}
      </nav>
      {!info || !team ? (
        <p className="text-center font-type text-mist">Carregando...</p>
      ) : ep && card ? (
        <KnowledgeCertificate ep={ep} team={team} card={card} className={cls?.name} />
      ) : (
        <p className="text-center font-type text-xl text-mist">
          O certificado aparece quando a dupla termina o episódio. 🎓
        </p>
      )}
    </div>
  );
}

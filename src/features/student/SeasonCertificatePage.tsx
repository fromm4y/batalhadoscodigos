import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ComicButton } from '@/components/comic';
import { SeasonCertificate } from '@/components/game/SeasonCertificate';
import { seasonEpisodes } from '@/content/season';
import { rankTeams, seasonMedal } from '@/engine/ranking';
import { useSeasonOrder } from '@/features/game/useEpisodeHook';
import { useSeasonCards } from '@/features/game/useSeasonCards';
import { downloadPng, fileSafe } from '@/lib/exportCertificates';
import { getFirebase } from '@/lib/firebase';
import type { ClassDoc, SchoolDoc, TeamDoc } from '@/types/domain';
import { NoSignalScreen } from './NoSignalScreen';
import { useTeamAuth, type TeamClaims } from './useTeamAuth';

/** `/certificado-temporada` — certificado da temporada da dupla (SPEC-02 E): baixa em PNG. */
export function SeasonCertificatePage() {
  const auth = useTeamAuth();
  if (auth.status === 'loading') return null;
  if (auth.status === 'none') return <NoSignalScreen />;
  return <Certificate claims={auth.claims} />;
}

type Team = TeamDoc & { id: string };

function Certificate({ claims }: { claims: TeamClaims }) {
  const info = useSeasonCards();
  const order = useSeasonOrder('student');
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [cls, setCls] = useState<ClassDoc | null>(null);
  const [school, setSchool] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const { db } = getFirebase('student');
    const a = onSnapshot(
      collection(db, 'classes', claims.classId, 'teams'),
      (s) => setTeams(s.docs.map((d) => ({ id: d.id, ...(d.data() as TeamDoc) }))),
      () => setTeams([]),
    );
    const b = onSnapshot(doc(db, 'classes', claims.classId), (s) =>
      setCls((s.data() as ClassDoc | undefined) ?? null),
    );
    return () => {
      a();
      b();
    };
  }, [claims]);
  useEffect(() => {
    if (!cls?.schoolId) return;
    void getDoc(doc(getFirebase('student').db, 'schools', cls.schoolId))
      .then((s) => setSchool((s.data() as SchoolDoc | undefined)?.name))
      .catch(() => undefined);
  }, [cls?.schoolId]);

  const row = teams ? rankTeams(teams).find((r) => r.team.id === claims.teamId) : undefined;
  const episodes = info
    ? seasonEpisodes(order)
        .map((e) => info[e.id])
        .filter((e) => !!e)
    : [];

  async function png() {
    if (!ref.current || !row) return;
    setBusy(true);
    setError(null);
    try {
      await downloadPng(ref.current, `certificado-${fileSafe(row.team.cityName)}.png`);
    } catch {
      setError('Não deu para baixar a imagem. Tentem de novo, ou usem "Imprimir".');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night px-4 py-6 print:bg-white print:p-0">
      <nav className="no-print mx-auto mb-4 flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <Link
          to="/album"
          className="grid min-h-11 place-items-center border-[3px] border-ink bg-graphite-light px-4 pt-1 font-heist text-xl tracking-wider text-paper"
        >
          ← Álbum
        </Link>
        {row && (
          <div className="flex flex-wrap gap-2">
            <ComicButton variant="brass" icon="⬇️" disabled={busy} onClick={() => void png()}>
              {busy ? 'Preparando...' : 'Baixar imagem (PNG)'}
            </ComicButton>
            <ComicButton variant="graphite" icon="🖨️" onClick={() => window.print()}>
              Imprimir
            </ComicButton>
          </div>
        )}
      </nav>
      {error && (
        <p role="alert" className="no-print mx-auto mb-4 max-w-[1100px] font-bold text-alert">
          {error}
        </p>
      )}
      {!info || !teams ? (
        <p className="text-center font-type text-mist">Carregando...</p>
      ) : row ? (
        <SeasonCertificate
          ref={ref}
          team={row.team}
          medal={seasonMedal(row.position, row.team.totalPoints)}
          position={row.team.totalPoints > 0 ? row.position : null}
          school={school}
          classLabel={cls?.name}
          season={cls?.season}
          episodes={episodes}
        />
      ) : (
        <p className="text-center font-type text-xl text-mist">Ficha da dupla não encontrada.</p>
      )}
    </div>
  );
}

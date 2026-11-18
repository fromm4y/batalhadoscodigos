import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ComicButton } from '@/components/comic';
import { SeasonCertificate } from '@/components/game/SeasonCertificate';
import { seasonEpisodes } from '@/content/season';
import { rankTeams, seasonMedal } from '@/engine/ranking';
import { useSeasonOrder } from '@/features/game/useEpisodeHook';
import { useSeasonCards } from '@/features/game/useSeasonCards';
import { downloadPdf, fileSafe } from '@/lib/exportCertificates';
import { useClass, useClassTeams, useSchools } from '../data';

/**
 * `/instrutor/turmas/:classId/certificados-temporada` — certificados da temporada da turma
 * (SPEC-02 E): medalhas para as 3 primeiras posições e participação para todas, um por página.
 * "Baixar PDF da turma" gera o arquivo (A4 deitado); "Imprimir" usa a impressora direto.
 */
export function ClassSeasonCertificatesPage() {
  const { classId = '' } = useParams();
  const cls = useClass(classId);
  const teams = useClassTeams(classId);
  const schools = useSchools();
  const order = useSeasonOrder('instructor');
  const info = useSeasonCards();
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = rankTeams(teams.data);
  const episodes = info
    ? seasonEpisodes(order)
        .map((e) => info[e.id])
        .filter((e) => !!e)
    : [];
  const school = schools.data.find((s) => s.id === cls.data?.schoolId)?.name;

  async function pdf() {
    setBusy(true);
    setError(null);
    try {
      const nodes = refs.current.filter((n): n is HTMLElement => !!n);
      await downloadPdf(nodes, `certificados-${fileSafe(cls.data?.name ?? 'turma')}.pdf`);
    } catch {
      setError('Não deu para gerar o PDF. Tentem de novo, ou usem "Imprimir".');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night px-4 py-6 print:bg-white print:p-0">
      <nav className="no-print mx-auto mb-4 flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <Link
          to={`/instrutor/turmas/${classId}`}
          className="grid min-h-11 place-items-center border-[3px] border-ink bg-graphite-light px-4 pt-1 font-heist text-xl tracking-wider text-paper"
        >
          ← Turma
        </Link>
        <p className="font-type text-mist">🏆 Certificados da temporada · {rows.length} dupla(s)</p>
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <ComicButton variant="brass" icon="📄" disabled={busy} onClick={() => void pdf()}>
              {busy ? 'Gerando o PDF...' : 'Baixar PDF da turma'}
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
      {!info || teams.loading ? (
        <p className="text-center font-type text-mist">Carregando...</p>
      ) : rows.length === 0 ? (
        <p className="text-center font-type text-xl text-mist">Esta turma ainda não tem duplas.</p>
      ) : (
        <div className="flex flex-col gap-6 print:gap-0">
          {rows.map(({ team, position }, i) => (
            <SeasonCertificate
              key={team.id}
              ref={(n) => {
                refs.current[i] = n;
              }}
              team={team}
              medal={seasonMedal(position, team.totalPoints)}
              position={team.totalPoints > 0 ? position : null}
              school={school}
              classLabel={cls.data?.name}
              season={cls.data?.season}
              episodes={episodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

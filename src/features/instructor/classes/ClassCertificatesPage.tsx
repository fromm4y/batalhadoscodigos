import { Link, useParams } from 'react-router';
import { ComicButton } from '@/components/comic';
import { KnowledgeCertificate } from '@/components/game/KnowledgeCertificate';
import { useSeasonCards } from '@/features/game/useSeasonCards';
import { useClass, useClassTeams } from '../data';

/**
 * `/instrutor/turmas/:classId/certificados/:episodeId` — todos os certificados do episódio da
 * turma, um por folha A4 (pedido da May, 16/11). Só duplas que ganharam a carta (jogaram).
 */
export function ClassCertificatesPage() {
  const { classId = '', episodeId = '' } = useParams();
  const cls = useClass(classId);
  const teams = useClassTeams(classId);
  const info = useSeasonCards();
  const ep = info?.[episodeId];
  const withCard = teams.data
    .map((t) => ({ t, card: t.cards?.find((c) => c.episodeId === episodeId) }))
    .filter((x) => !!x.card)
    .sort((a, b) => a.t.cityName.localeCompare(b.t.cityName, 'pt-BR'));

  return (
    <div className="min-h-screen bg-night px-4 py-6 print:bg-white print:p-0">
      <nav className="no-print mx-auto mb-4 flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
        <Link
          to={`/instrutor/turmas/${classId}`}
          className="grid min-h-11 place-items-center border-[3px] border-ink bg-graphite-light px-4 pt-1 font-heist text-xl tracking-wider text-paper"
        >
          ← Turma
        </Link>
        <p className="font-type text-mist">
          {ep ? `Ep. ${ep.number} — ${ep.title}` : ''} · {withCard.length} certificado(s)
        </p>
        {withCard.length > 0 && (
          <ComicButton variant="brass" icon="🖨️" onClick={() => window.print()}>
            Imprimir todos
          </ComicButton>
        )}
      </nav>
      {!ep || teams.loading ? (
        <p className="text-center font-type text-mist">Carregando...</p>
      ) : withCard.length === 0 ? (
        <p className="text-center font-type text-xl text-mist">
          Nenhuma dupla terminou este episódio ainda. Os certificados aparecem depois do fim.
        </p>
      ) : (
        <div className="flex flex-col gap-6 print:gap-0">
          {withCard.map(({ t, card }) => (
            <KnowledgeCertificate
              key={t.id}
              ep={ep}
              team={t}
              card={card!}
              className={cls.data?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

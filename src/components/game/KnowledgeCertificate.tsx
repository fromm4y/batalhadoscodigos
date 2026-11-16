import { Avatar } from '@/components/avatar/Avatar';
import { ComicArt, cn } from '@/components/comic';
import type { SeasonCardInfo } from '@/features/game/useSeasonCards';
import type { TeamCard, TeamDoc } from '@/types/domain';

/**
 * Certificado de conhecimento do episódio (pedido da May, 16/11), pronto para imprimir em A4
 * deitado. Papel claro (economiza tinta). LGPD: NENHUM nome de aluno — duas linhas "Nome:" em
 * branco para escrever à mão depois de impresso.
 */
export function KnowledgeCertificate({
  ep,
  team,
  card,
  className: classLabel,
}: {
  ep: SeasonCardInfo;
  team: Pick<TeamDoc, 'cityName' | 'pirateName' | 'avatar'>;
  card: TeamCard;
  /** nome da turma, ex.: "5º A" */
  className?: string;
}) {
  const gold = card.variant === 'dourada';
  const date = card.earnedAt?.toDate?.().toLocaleDateString('pt-BR') ?? '';
  return (
    <article
      aria-label={`Certificado do Episódio ${ep.number}: ${ep.title}`}
      className="certificate relative mx-auto flex aspect-[297/210] w-full max-w-[1100px] flex-col overflow-hidden border-[10px] border-double border-ink bg-[#f6efdc] p-[3%] text-ink print:max-w-none print:shadow-none"
    >
      <div className="pointer-events-none absolute inset-3 border-2 border-[#a8834a]" aria-hidden />
      <header className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-heist text-[clamp(14px,2vw,22px)] tracking-[0.3em] text-[#7a0f18]">
            A GRANDE CAÇADA AOS CÓDIGOS
          </p>
          <h1 className="font-heist text-[clamp(28px,5.6vw,68px)] leading-none tracking-[0.08em]">
            CERTIFICADO DE CONHECIMENTO
          </h1>
        </div>
        <p
          className={cn(
            'rotate-[-6deg] border-4 px-3 pt-1 font-heist text-[clamp(14px,2vw,24px)] tracking-widest',
            gold ? 'border-[#8a6418] text-[#8a6418]' : 'border-[#7a0f18] text-[#7a0f18]',
          )}
        >
          {gold ? '★ MISSÃO VENCIDA' : 'MISSÃO CUMPRIDA'}
        </p>
      </header>

      <div className="relative mt-[2%] grid flex-1 grid-cols-[1fr_auto] gap-[3%]">
        <div className="flex flex-col gap-[3%]">
          <p className="text-[clamp(14px,2vw,26px)] leading-snug">
            Certificamos que a dupla{' '}
            <strong className="font-heist text-[1.3em] tracking-wider">
              {team.cityName} · {team.pirateName}
            </strong>
            {classLabel ? `, da turma ${classLabel},` : ''} concluiu o{' '}
            <strong>
              Episódio {ep.number}: {ep.title}
            </strong>{' '}
            ({ep.invention.name}, {ep.invention.year}) e estudou{' '}
            <strong>{ep.certificate.skill}</strong>:
          </p>
          <ul className="list-disc space-y-[0.4em] pl-6 text-[clamp(13px,1.85vw,24px)]">
            {ep.certificate.learned.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="text-[clamp(12px,1.5vw,19px)] italic">
            Inventores e personagens: {ep.invention.people.join(', ')}.
          </p>
          <div className="mt-auto grid grid-cols-2 gap-x-[4%] gap-y-[4%] text-[clamp(13px,1.7vw,21px)]">
            <p className="border-b-2 border-ink pb-1">Nome:</p>
            <p className="border-b-2 border-ink pb-1">Nome:</p>
            <p className="border-b-2 border-ink pb-1">Narradora:</p>
            <p className="border-b-2 border-ink pb-1">Data: {date}</p>
          </div>
        </div>
        <div className="flex w-[clamp(110px,18vw,210px)] flex-col items-center gap-2">
          <div
            className={cn(
              'aspect-[600/840] w-full overflow-hidden rounded-md border-4',
              gold ? 'border-[#d4a537]' : 'border-ink',
            )}
          >
            <ComicArt id={ep.card.art} alt="" />
          </div>
          <div className="h-[clamp(60px,9vw,110px)] w-[clamp(50px,7.5vw,92px)] overflow-hidden rounded-md border-2 border-ink bg-[#e9dcb8]">
            <Avatar avatar={team.avatar} side="red" className="h-full w-full" decorative />
          </div>
        </div>
      </div>
    </article>
  );
}

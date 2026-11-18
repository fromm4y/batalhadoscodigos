import { forwardRef } from 'react';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicArt, cn } from '@/components/comic';
import { BADGES, badgeCounts, teamLevel } from '@/engine/badges';
import type { SeasonMedal } from '@/engine/ranking';
import type { SeasonCardInfo } from '@/features/game/useSeasonCards';
import type { TeamDoc } from '@/types/domain';

const MEDAL: Record<SeasonMedal, { icon: string; label: string; tone: string }> = {
  ouro: { icon: '🥇', label: 'MEDALHA DE OURO', tone: 'border-[#8a6418] text-[#8a6418]' },
  prata: { icon: '🥈', label: 'MEDALHA DE PRATA', tone: 'border-[#5c6570] text-[#5c6570]' },
  bronze: { icon: '🥉', label: 'MEDALHA DE BRONZE', tone: 'border-[#8a4b1f] text-[#8a4b1f]' },
};

/**
 * Certificado da temporada (SPEC-02 Parte E), A4 deitado, papel claro. Medalha para as 3
 * primeiras posições do ranking e participação para todas. Traz escola, turma, temporada,
 * avatar, codinome e nome pirata, nível, pontos, cartas e selos.
 * LGPD: NENHUM nome de aluno — duas linhas "Nome:" em branco para escrever à mão.
 */
export const SeasonCertificate = forwardRef<
  HTMLElement,
  {
    team: Pick<
      TeamDoc,
      'cityName' | 'pirateName' | 'avatar' | 'totalPoints' | 'cards' | 'badges' | 'episodesPlayed'
    >;
    medal: SeasonMedal | null;
    position: number | null;
    school?: string;
    classLabel?: string;
    season?: string;
    /** episódios da temporada ativa, na ordem (para as cartas) */
    episodes: SeasonCardInfo[];
  }
>(function SeasonCertificate({ team, medal, position, school, classLabel, season, episodes }, ref) {
  const played = team.episodesPlayed ?? team.cards?.length ?? 0;
  const badges = badgeCounts(team.badges);
  const m = medal ? MEDAL[medal] : null;
  return (
    <article
      ref={ref}
      aria-label={`Certificado da temporada de ${team.cityName}`}
      className="certificate relative mx-auto flex aspect-[297/210] w-full max-w-[1100px] flex-col overflow-hidden border-[10px] border-double border-ink bg-[#f6efdc] p-[3%] text-ink print:max-w-none print:shadow-none"
    >
      <div className="pointer-events-none absolute inset-3 border-2 border-[#a8834a]" aria-hidden />
      <header className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-heist text-[clamp(14px,2vw,22px)] tracking-[0.3em] text-[#7a0f18]">
            A GRANDE CAÇADA AOS CÓDIGOS
          </p>
          <h1 className="font-heist text-[clamp(28px,5.4vw,66px)] leading-none tracking-[0.08em]">
            CERTIFICADO DA TEMPORADA
          </h1>
          <p className="mt-1 font-type text-[clamp(11px,1.4vw,17px)]">
            {[
              school,
              classLabel ? `Turma ${classLabel}` : null,
              season ? `Temporada ${season}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <p
          className={cn(
            'flex rotate-[-6deg] flex-col items-center border-4 px-3 pt-1 text-center font-heist leading-none tracking-widest',
            m ? m.tone : 'border-[#7a0f18] text-[#7a0f18]',
          )}
        >
          <span className="text-[clamp(28px,5vw,60px)]" aria-hidden>
            {m ? m.icon : '🎖️'}
          </span>
          <span className="text-[clamp(13px,1.8vw,22px)]">{m ? m.label : 'PARTICIPAÇÃO'}</span>
          {position && (
            <span className="text-[clamp(11px,1.3vw,16px)]">{position}º lugar no ranking</span>
          )}
        </p>
      </header>

      <div className="relative mt-[1.5%] grid flex-1 grid-cols-[auto_1fr] gap-[3%]">
        <div className="flex w-[clamp(90px,15vw,175px)] flex-col items-center gap-2">
          <div className="aspect-[5/6] w-full overflow-hidden rounded-md border-4 border-ink bg-[#e9dcb8]">
            <Avatar avatar={team.avatar} side="red" className="h-full w-full" decorative />
          </div>
          <p className="text-center font-heist text-[clamp(18px,2.6vw,32px)] leading-none">
            {team.totalPoints}
            <span className="block font-type text-[clamp(10px,1.1vw,14px)]">
              pontos na temporada
            </span>
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-[2%]">
          <p className="text-[clamp(14px,2vw,25px)] leading-snug">
            Certificamos que a dupla{' '}
            <strong className="font-heist text-[1.3em] tracking-wider">
              {team.cityName} · {team.pirateName}
            </strong>{' '}
            participou da temporada, jogou <strong>{played}</strong>{' '}
            {played === 1 ? 'episódio' : 'episódios'} e chegou ao nível{' '}
            <strong>
              {teamLevel(played, 'red')} / {teamLevel(played, 'blue')}
            </strong>
            .
          </p>
          <div>
            <p className="font-heist text-[clamp(13px,1.6vw,20px)] tracking-widest">
              CARTAS CONQUISTADAS
            </p>
            <ul className="flex gap-[1.5%]" aria-label="Cartas da temporada">
              {episodes.map((e) => {
                const c = team.cards?.find((x) => x.episodeId === e.id);
                return (
                  <li
                    key={e.id}
                    title={`Ep. ${e.number}: ${e.card.title}`}
                    className={cn(
                      'relative aspect-[600/840] w-[clamp(38px,6.2vw,74px)] overflow-hidden rounded-sm border-[3px]',
                      c?.variant === 'dourada'
                        ? 'border-[#d4a537]'
                        : c
                          ? 'border-ink'
                          : 'border-dashed border-ink/40',
                    )}
                  >
                    {c ? (
                      <ComicArt id={e.card.art} alt="" />
                    ) : (
                      <span className="grid h-full place-items-center font-heist text-ink/40">
                        ?
                      </span>
                    )}
                    {c?.variant === 'dourada' && (
                      <span className="absolute top-0 right-0.5 text-[clamp(10px,1.2vw,15px)]">
                        ★
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {badges.length > 0 && (
            <div>
              <p className="font-heist text-[clamp(13px,1.6vw,20px)] tracking-widest">SELOS</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[clamp(11px,1.35vw,17px)]">
                {badges.map(([id, n]) => (
                  <li key={id}>
                    {BADGES[id].icon} {BADGES[id].name}
                    {n > 1 ? ` ×${n}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto grid grid-cols-2 gap-x-[4%] gap-y-[5%] text-[clamp(13px,1.7vw,21px)]">
            <p className="border-b-2 border-ink pb-1">Nome:</p>
            <p className="border-b-2 border-ink pb-1">Nome:</p>
            <p className="border-b-2 border-ink pb-1">Narradora:</p>
            <p className="border-b-2 border-ink pb-1">
              Data: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
});

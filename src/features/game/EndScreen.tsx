import {
  ComicArt,
  ComicPanel,
  HalftoneBackground,
  Onomatopoeia,
  SpeechBubble,
} from '@/components/comic';
import { Spotlights, Stamp, Typewriter } from '@/components/scene';
import type { Episode } from '@/content/types';
import type { MatchDoc, PlayerDoc, TeamDoc } from '@/types/domain';

/**
 * Fase `end` (versão da Etapa 3): pontos do episódio, revelação histórica e gancho.
 * O resultado do confronto, o ranking animado e o cliffhanger completo chegam nas Etapas 4 e 6.
 */
export function EndScreen({
  episode,
  team,
  player,
  match,
}: {
  episode: Episode;
  team: TeamDoc;
  player: PlayerDoc;
  match: MatchDoc | null;
}) {
  const red = player.side !== 'blue';
  // RN-53: resultado do confronto em quadro gigante.
  const result = !match?.winner
    ? null
    : match.winner === 'draw'
      ? {
          title: 'EMPATE!',
          kind: 'brass' as const,
          text: 'Ninguém cedeu um centímetro. +2 para cada lado!',
        }
      : match.winner === player.side
        ? {
            title: 'VITÓRIA!',
            kind: 'success' as const,
            text: red ? 'A vitrine é de vocês!' : 'O tesouro está a salvo!',
          }
        : {
            title: 'QUASE!',
            kind: 'alert' as const,
            text: 'Foi por pouco. Semana que vem tem revanche!',
          };
  return (
    <HalftoneBackground>
      <Spotlights intensity={0.14} />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-8 py-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="font-type text-mist">Fim do episódio {episode.number}</p>
            {result ? (
              <>
                <h1
                  className={`font-comic text-8xl leading-none tracking-wide text-outline-thick ${result.kind === 'success' ? 'text-success' : result.kind === 'brass' ? 'text-brass' : 'text-alert'}`}
                >
                  {result.title}
                </h1>
                <p className="font-type text-xl text-paper">{result.text}</p>
              </>
            ) : (
              <h1 className="font-heist text-6xl tracking-[0.1em] text-paper text-glow-spot">
                MISSÃO ENCERRADA
              </h1>
            )}
            <p className="font-heist text-3xl tracking-wider text-brass text-glow-brass">
              {red ? '🪙' : '💰'} {player.episodePoints >= 0 ? '+' : ''}
              {player.episodePoints} pontos hoje · total {team.totalPoints}
            </p>
            <p className="font-type text-mist">
              Cadeados abertos: {player.progress.lockIndex}/3 · Cofre:{' '}
              {player.progress.vaultSolvedAt ? 'aberto ✔' : 'fechado'}
            </p>
          </div>
          {(match?.winner === player.side || (!match && player.progress.vaultSolvedAt)) && (
            <Onomatopoeia kind="boom" size={190} />
          )}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {episode.reveal.map((p, i) => (
            <ComicPanel
              key={i}
              flush
              tone="graphite"
              caption={p.caption ? undefined : 'Revelação'}
              delay={i * 0.3}
              className="flex h-72 flex-col"
            >
              <div className="h-40 overflow-hidden">
                <ComicArt id={p.art} alt={p.caption ?? 'Quadro da revelação'} />
              </div>
              <div className="flex-1 bg-aged p-3 text-ink">
                {p.caption && <p className="font-type text-base">{p.caption}</p>}
                {p.speech && <p className="font-body text-base font-bold">“{p.speech.text}”</p>}
              </div>
            </ComicPanel>
          ))}
        </div>
        <div className="relative mt-2 flex items-center justify-between gap-6 rounded-hand border-4 border-ink bg-noir p-6">
          <div>
            <p className="font-heist text-3xl tracking-[0.2em] text-bando text-glow-red animate-glitch">
              TRANSMISSÃO INTERCEPTADA
            </p>
            <Typewriter
              text={episode.nextHook}
              speed={45}
              delay={800}
              className="mt-2 text-xl text-paper"
            />
          </div>
          <Stamp text="PRÓXIMA SEMANA" color="brass" rotate={-8} delay={1.5} />
        </div>
        <SpeechBubble who="narradora" tail="left" className="max-w-xl">
          Prestem atenção na Narradora: ela vai contar o que aconteceu de verdade com essa invenção!
        </SpeechBubble>
      </main>
    </HalftoneBackground>
  );
}

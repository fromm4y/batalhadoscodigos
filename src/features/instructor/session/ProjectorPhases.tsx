import { motion } from 'framer-motion';
import { useState } from 'react';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicArt, cn } from '@/components/comic';
import { RankingPodium } from '@/components/game/RankingPodium';
import { TugBar } from '@/components/game/TugBar';
import { RobotFigure, Stamp, Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import type { Episode } from '@/content/types';
import type { MatchDoc, PlayerDoc, SessionDoc, Side, TeamDoc } from '@/types/domain';
import type { WithId } from '../data';

type Teams = WithId<TeamDoc>[];

/** `planning` no projetor (SPEC 9.4): pódio + contagem de lados escolhidos. */
export function ProjectorPlanning({ teams, players }: { teams: Teams; players: PlayerDoc[] }) {
  const red = players.filter((p) => p.side === 'red').length;
  const blue = players.filter((p) => p.side === 'blue').length;
  const none = players.length - red - blue;
  return (
    <div className="flex w-full flex-col items-center gap-8">
      <h1 className="font-heist text-7xl tracking-[0.12em] text-brass text-glow-brass">
        QUEM ESTÁ NA FRENTE?
      </h1>
      <RankingPodium teams={teams} size="xl" maxRest={6} className="w-full max-w-6xl" />
      <div className="flex items-center gap-10 font-heist text-5xl tracking-wider">
        <span className="text-bando text-glow-red">🎭 Bando {red}</span>
        <span className="text-mist">×</span>
        <span className="text-piratas text-glow-blue">⚓ Piratas {blue}</span>
        {none > 0 && <span className="text-3xl text-mist">({none} escolhendo...)</span>}
      </div>
    </div>
  );
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * `locks`/`vault` no projetor (SPEC 9.4): todos os confrontos com as barras ao vivo e o timer
 * da fase, **sem** pontuação individual.
 */
export function ProjectorMatches({
  session,
  teams,
  players,
  matches,
  now,
}: {
  session: SessionDoc;
  teams: Teams;
  players: WithId<PlayerDoc>[];
  matches: WithId<MatchDoc>[];
  now: number;
}) {
  const elapsed = Math.max(
    0,
    Math.floor((now - (session.phaseStartedAt?.toMillis?.() ?? now)) / 1000),
  );
  const guide = GAME_RULES.phaseGuideMinutes[session.phase];
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const playerById = new Map(players.map((p) => [p.id, p]));
  const sorted = [...matches].sort((a, b) => a.id.localeCompare(b.id));
  const big = sorted.length <= 4;

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-end justify-between">
        <h1 className="font-heist text-7xl tracking-[0.12em] text-paper text-glow-spot">
          {session.phase === 'vault' ? 'O COFRE' : 'OS CADEADOS'}
        </h1>
        <p
          className="font-heist text-7xl tracking-wider text-brass text-glow-brass"
          aria-label="Tempo da fase"
        >
          ⏱ {fmt(elapsed)}
          {guide > 0 && <span className="ml-3 text-3xl text-mist">/ {guide} min</span>}
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="font-type text-4xl text-mist">Os confrontos ainda não foram formados.</p>
      ) : (
        <ul className={cn('grid gap-5', big ? 'grid-cols-1' : 'grid-cols-2')}>
          {sorted.map((m, i) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-hand border-4 border-ink bg-graphite/90 p-4 shadow-[8px_8px_0_#000]"
            >
              <div className="flex items-center gap-4">
                <Fighter
                  side="red"
                  match={m}
                  team={m.redTeamId ? teamById.get(m.redTeamId) : undefined}
                  player={m.redTeamId ? playerById.get(m.redTeamId) : undefined}
                  big={big}
                />
                <div className="flex-1">
                  <TugBar
                    bar={m.bar}
                    redName={name(m, 'red', teamById)}
                    blueName={name(m, 'blue', teamById)}
                    compact={!big}
                  />
                  {m.winner && (
                    <p className="mt-1 text-center font-comic text-4xl tracking-wide text-brass text-outline">
                      {m.winner === 'draw'
                        ? 'EMPATE!'
                        : `${m.winner === 'red' ? '🎭' : '⚓'} ${name(m, m.winner, teamById)} VENCEU!`}
                    </p>
                  )}
                </div>
                <Fighter
                  side="blue"
                  match={m}
                  team={m.blueTeamId ? teamById.get(m.blueTeamId) : undefined}
                  player={m.blueTeamId ? playerById.get(m.blueTeamId) : undefined}
                  big={big}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function name(m: MatchDoc, side: Side, teamById: Map<string, TeamDoc>): string {
  if (m.machineSide === side) return 'Robô';
  const id = side === 'red' ? m.redTeamId : m.blueTeamId;
  return (id && teamById.get(id)?.cityName) || '—';
}

/** Avatar + cadeados abertos (pontos de luz) de um lado do confronto. */
function Fighter({
  side,
  match,
  team,
  player,
  big,
}: {
  side: Side;
  match: MatchDoc;
  team: TeamDoc | undefined;
  player: PlayerDoc | undefined;
  big: boolean;
}) {
  const machine = match.machineSide === side;
  const locks = machine ? (match.machine?.lockIndex ?? 0) : (player?.progress.lockIndex ?? 0);
  const vault = machine ? !!match.machine?.vaultSolved : !!player?.progress.vaultSolvedAt;
  const lit = side === 'red' ? 'bg-bando glow-red' : 'bg-piratas glow-blue';
  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-1', big ? 'w-32' : 'w-24')}>
      {machine ? (
        <RobotFigure
          mood={match.winner && match.winner !== side ? 'derrotado' : 'provocando'}
          className={big ? 'h-28 w-28' : 'h-20 w-20'}
        />
      ) : team ? (
        <Avatar
          avatar={team.avatar}
          side={side}
          className={big ? 'h-28 w-24' : 'h-20 w-16'}
          decorative
        />
      ) : null}
      <span className="sr-only">
        {locks} de 3 cadeados{vault ? ', Cofre aberto' : ''}
      </span>
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'rounded-full border-2 border-ink',
              big ? 'h-5 w-5' : 'h-4 w-4',
              i < locks ? lit : 'bg-graphite-light',
            )}
          />
        ))}
        <span
          className={cn(
            'grid place-items-center rounded-sm border-2 border-ink text-xs',
            big ? 'h-5 w-5' : 'h-4 w-4',
            vault ? 'bg-brass glow-brass' : 'bg-graphite-light',
          )}
        >
          {side === 'red' ? '◆' : '✕'}
        </span>
      </div>
    </div>
  );
}

/** `end` no projetor (SPEC 9.4): ranking final animado e o gancho. A Narradora alterna. */
export function ProjectorEnd({ teams, episode }: { teams: Teams; episode: Episode | null }) {
  const [view, setView] = useState<'ranking' | 'hook'>('ranking');
  return (
    <div className="flex w-full flex-col items-center gap-6">
      {view === 'ranking' || !episode ? (
        <>
          <h1 className="font-heist text-8xl tracking-[0.12em] text-brass text-glow-brass">
            RANKING FINAL
          </h1>
          <RankingPodium teams={teams} size="xl" maxRest={8} className="w-full max-w-6xl" />
        </>
      ) : (
        <div className="grid w-full max-w-7xl grid-cols-[1.1fr_1fr] items-center gap-12">
          <div className="flex flex-col gap-6 text-left">
            <p className="font-heist text-7xl leading-none tracking-[0.18em] text-bando text-glow-red animate-glitch">
              TRANSMISSÃO INTERCEPTADA
            </p>
            <Typewriter
              text={episode.nextHook}
              speed={45}
              delay={600}
              className="text-4xl text-paper"
            />
          </div>
          <div className="relative">
            <div className="aspect-[16/9] overflow-hidden rounded-sm border-4 border-ink">
              <ComicArt
                id={`proximo-ep${episode.number + 1}`}
                alt="Um objeto misterioso coberto por um pano, sob um holofote"
              />
            </div>
            <Stamp
              text="PRÓXIMA SEMANA"
              color="brass"
              rotate={-10}
              delay={2}
              className="absolute -bottom-8 -left-8 scale-150"
            />
          </div>
        </div>
      )}
      {episode && (
        <div className="fixed right-4 bottom-4 flex gap-2 opacity-40 transition-opacity hover:opacity-100 focus-within:opacity-100">
          {(['ranking', 'hook'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-xl tracking-wider',
                view === v ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
              )}
            >
              {v === 'ranking' ? '🏆 Ranking' : '📡 Gancho'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

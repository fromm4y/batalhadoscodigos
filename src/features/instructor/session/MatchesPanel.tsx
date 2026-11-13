import { ComicPanel, cn } from '@/components/comic';
import { TugBar } from '@/components/game/TugBar';
import type { MatchDoc, TeamDoc } from '@/types/domain';
import type { WithId } from '../data';

/** Confrontos ao vivo (SPEC 9.3): as duas duplas (ou robô), mini-barra e resultado. */
export function MatchesPanel({
  matches,
  teams,
}: {
  matches: WithId<MatchDoc>[];
  teams: WithId<TeamDoc>[];
}) {
  const byId = new Map(teams.map((t) => [t.id, t]));
  if (matches.length === 0) return null;
  return (
    <ComicPanel caption={`Confrontos · ${matches.length}`} tone="graphite" className="pt-8">
      <ul className="grid gap-3">
        {matches.map((m) => {
          const red = m.redTeamId ? byId.get(m.redTeamId)?.cityName : null;
          const blue = m.blueTeamId ? byId.get(m.blueTeamId)?.pirateName : null;
          const last = m.log.at(-1);
          return (
            <li key={m.id} className="rounded-md border-2 border-graphite-light bg-night/60 p-2">
              <TugBar bar={m.bar} redName={red ?? '🤖 Robô'} blueName={blue ?? 'Robô 🤖'} compact />
              <p className="mt-1 flex justify-between gap-2 font-type text-xs text-mist">
                <span className="truncate">{last ? `📻 ${last.text}` : 'Ainda sem puxões.'}</span>
                <span
                  className={cn(
                    'shrink-0 font-heist text-base tracking-wider',
                    m.winner === 'red'
                      ? 'text-bando'
                      : m.winner === 'blue'
                        ? 'text-piratas'
                        : 'text-brass',
                  )}
                >
                  {m.winner
                    ? m.winner === 'draw'
                      ? 'EMPATE'
                      : `VENCEU: ${m.winner === 'red' ? 'BANDO' : 'PIRATAS'}`
                    : m.vaultLeader
                      ? `⭐ vantagem: ${m.vaultLeader === 'red' ? 'Bando' : 'Piratas'}`
                      : `barra ${m.bar > 0 ? '+' : ''}${m.bar}`}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </ComicPanel>
  );
}

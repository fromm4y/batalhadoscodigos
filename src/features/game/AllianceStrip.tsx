import { useState } from 'react';
import { canReinforce, reinforceTargets, vaultGoal } from '@/engine/coop';
import type { CoopState, TeamDoc } from '@/types/domain';

type NamedTeam = TeamDoc & { id: string };

/**
 * Ep. 5 (RN-C5 e RN-C7): faixa da Aliança no Cofre. Todas veem quantas duplas já abriram o
 * Cofre (e a meta); quem abriu vira Reforço e manda UMA dica para uma dupla que ainda não terminou.
 */
export function AllianceStrip({
  coop,
  teamId,
  teams,
  onSend,
}: {
  coop: CoopState;
  teamId: string;
  teams: NamedTeam[];
  onSend: (to: string) => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const goal = vaultGoal(coop.teams.length);
  const name = (id: string) => teams.find((t) => t.id === id)?.cityName ?? 'uma dupla';
  const sentTo = coop.reinforcements[teamId];
  const targets = reinforceTargets(coop);
  const reinforcer = canReinforce(coop, teamId);
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border-[3px] border-brass bg-night/80 px-3 py-2 text-paper"
      aria-label="A Aliança"
    >
      <p className="font-heist text-2xl tracking-wider text-brass">
        🔓 {coop.vaultSolvers.length} de {coop.teams.length} duplas abriram o Cofre
        <span className="ml-2 font-type text-sm text-mist">
          (a turma vence com {goal} antes da máquina)
        </span>
      </p>
      {sentTo ? (
        <p className="font-type text-base text-success">🤝 Reforço enviado para {name(sentTo)}!</p>
      ) : reinforcer && targets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-type text-base">🤝 Vocês são REFORÇO! Mandem a Dica 1 para:</span>
          {targets.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onSend(id).finally(() => setBusy(false));
              }}
              className="min-h-11 cursor-pointer border-[3px] border-ink bg-brass px-3 pt-1 font-heist text-lg tracking-wider text-ink hover:glow-brass disabled:opacity-50"
            >
              📨 {name(id)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

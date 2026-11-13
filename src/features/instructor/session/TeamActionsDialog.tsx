import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/avatar/Avatar';
import { ComicButton, cn } from '@/components/comic';
import type { Episode } from '@/content/types';
import { resolveChallenge } from '@/engine/challenges';
import { ABILITY_INFO } from '@/engine/match';
import { LEDGER_LABEL } from '@/features/game/ledgerLabels';
import { currentStage } from '@/engine/progress';
import type { Level, Phase, PlayerDoc, TeamDoc } from '@/types/domain';
import { useLedger, type WithId } from '../data';
import type { Ctx } from './matchOps';
import { giveAbility, giveFreeHint, givePoints, setPhaseOverride, setSide } from './sessionOps';

const PHASES: { id: Phase | 'turma'; label: string }[] = [
  { id: 'turma', label: 'Igual à turma' },
  { id: 'planning', label: 'Planejamento' },
  { id: 'locks', label: 'Cadeados' },
  { id: 'vault', label: 'Cofre' },
  { id: 'end', label: 'Fim' },
];

type Props = {
  ctx: Ctx;
  team: WithId<TeamDoc>;
  player: WithId<PlayerDoc>;
  episode: Episode | null;
  level: Level | null;
  onClose: () => void;
};

/** Ações por dupla (SPEC 9.3, RN-07, RN-14, RN-47). */
export function TeamActionsDialog({ ctx, team, player, episode, level, onClose }: Props) {
  const [delta, setDelta] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const ledger = useLedger(ctx.session.classId, team.id);
  const entries = ledger.data
    .filter((e) => e.sessionId === ctx.sessionId)
    .sort((a, b) => (a.at?.toMillis() ?? 0) - (b.at?.toMillis() ?? 0));
  const phase = player.phaseOverride ?? ctx.session.phase;
  const stage = currentStage(phase, player.progress);
  const challenge =
    episode && level && player.side && stage.kind === 'challenge'
      ? resolveChallenge(episode, player.side, level, stage.slot)
      : null;
  const canChangeSide = ctx.session.phase === 'lobby' || ctx.session.phase === 'planning';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    try {
      await fn();
      setMsg(ok);
    } catch (err) {
      console.error('[painel]', err);
      setMsg('Não deu certo. Tente de novo.');
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-actions-title"
        className="grid max-h-[90vh] w-full max-w-4xl grid-cols-[1.1fr_1fr] gap-6 overflow-y-auto rounded-sm border-[3px] border-ink bg-aged p-6 text-ink shadow-comic"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar avatar={team.avatar} side={player.side} className="h-20 w-16" decorative />
            <div>
              <h2 id="team-actions-title" className="font-heist text-4xl tracking-wider">
                {team.cityName} · {team.pirateName}
              </h2>
              <p className="font-type text-sm">
                {player.side === 'red'
                  ? '🎭 Bando'
                  : player.side === 'blue'
                    ? '⚓ Piratas'
                    : 'sem lado'}{' '}
                · total {team.totalPoints} · hoje {player.episodePoints}
              </p>
            </div>
          </div>

          <fieldset className="grid gap-2 border-2 border-dashed border-ink/40 p-3">
            <legend className="px-1 font-type text-sm uppercase">Pontos (ajuste manual)</legend>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Menos"
                onClick={() => setDelta((d) => d - 1)}
                className="h-11 w-11 cursor-pointer border-[3px] border-ink bg-paper font-heist text-2xl"
              >
                −
              </button>
              <span className="w-14 text-center font-heist text-3xl" aria-live="polite">
                {delta > 0 ? `+${delta}` : delta}
              </span>
              <button
                type="button"
                aria-label="Mais"
                onClick={() => setDelta((d) => d + 1)}
                className="h-11 w-11 cursor-pointer border-[3px] border-ink bg-paper font-heist text-2xl"
              >
                +
              </button>
              <ComicButton
                variant="brass"
                icon="✔"
                disabled={delta === 0}
                onClick={() =>
                  void run(
                    () => givePoints(ctx, team.id, delta),
                    `Pontos lançados (${delta > 0 ? '+' : ''}${delta}).`,
                  )
                }
              >
                Lançar
              </ComicButton>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <ComicButton
              variant="paper"
              icon="💡"
              disabled={!challenge}
              title={challenge ? `No desafio "${challenge.title}"` : 'A dupla não está num desafio'}
              onClick={() =>
                challenge &&
                void run(
                  () => giveFreeHint(ctx.sessionId, team.id, challenge.key),
                  'Dica 1 entregue.',
                )
              }
            >
              Dar Dica 1
            </ComicButton>
            <ComicButton
              variant="paper"
              icon="🃏"
              disabled={!player.side}
              onClick={() =>
                void run(async () => {
                  const id = await giveAbility(ctx.sessionId, team.id);
                  if (!id) throw new Error('sem habilidade');
                  setMsg(`Habilidade entregue: ${ABILITY_INFO[id].name}.`);
                }, '')
              }
            >
              Dar habilidade
            </ComicButton>
          </div>

          <label className="grid gap-1">
            <span className="font-type text-sm uppercase">
              Fase só desta dupla (chegou atrasada / adiantar)
            </span>
            <select
              value={player.phaseOverride ?? 'turma'}
              onChange={(e) =>
                void run(
                  () =>
                    setPhaseOverride(
                      ctx.sessionId,
                      team.id,
                      e.target.value === 'turma' ? null : (e.target.value as Phase),
                    ),
                  'Fase da dupla atualizada.',
                )
              }
              className="min-h-11 border-[3px] border-ink bg-paper px-3 font-bold"
            >
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {canChangeSide && (
            <div className="flex items-center gap-2">
              <span className="font-type text-sm uppercase">Lado:</span>
              {(['red', 'blue'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={player.side === s}
                  disabled={!!player.matchId}
                  onClick={() =>
                    void run(() => setSide(ctx.sessionId, team.id, s), 'Lado trocado.')
                  }
                  className={cn(
                    'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-xl disabled:cursor-not-allowed disabled:opacity-50',
                    player.side === s
                      ? s === 'red'
                        ? 'bg-bando text-paper'
                        : 'bg-piratas text-paper'
                      : 'bg-paper',
                  )}
                >
                  {s === 'red' ? '🎭 Bando' : '⚓ Piratas'}
                </button>
              ))}
              {player.matchId && (
                <span className="text-xs">(desfaça os confrontos para trocar)</span>
              )}
            </div>
          )}

          {msg && (
            <p role="status" className="font-bold">
              {msg}
            </p>
          )}
          <ComicButton variant="graphite" onClick={onClose} className="self-start">
            Fechar
          </ComicButton>
        </div>

        <section aria-label="Extrato desta sessão">
          <h3 className="mb-2 font-type text-sm uppercase">Extrato desta aula</h3>
          {entries.length === 0 ? (
            <p className="text-sm">Nenhum ponto ainda.</p>
          ) : (
            <ol className="grid gap-1">
              {entries.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-ink/20 py-1 text-sm">
                  <span>{LEDGER_LABEL[e.reason] ?? e.reason}</span>
                  <strong className={e.delta < 0 ? 'text-bando-dark' : 'text-success'}>
                    {e.delta > 0 ? '+' : ''}
                    {e.delta}
                  </strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </motion.div>
  );
}

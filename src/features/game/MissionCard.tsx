import { cn } from '@/components/comic';
import { powerIcon } from './cardLabels';
import { GAME_RULES } from '@/config/gameRules';
import { cardEffect, cardUsesLeft } from '@/engine/cards';
import type { PlayerDoc, TeamDoc } from '@/types/domain';
import { useSeasonCards } from './useSeasonCards';

const BOOST_TEXT = {
  extraPull: `💪 Bombe pronta: o próximo cadeado puxa +${GAME_RULES.cards.extraPull}!`,
  forgiveMiss: '🛟 Válvula pronta: o próximo erro não tira ponto.',
  lightningPlus: `⏱️ +${GAME_RULES.cards.lightningPlusMinutes} min no Cofre Relâmpago!`,
} as const;

/**
 * A carta do Álbum levada na missão (pedido da May, 16/11): mostra o poder, os usos que sobram
 * e o botão de usar. Fica na lateral da tela de jogo, perto das habilidades.
 */
export function MissionCard({
  team,
  player,
  challengeKey,
  usedHints,
  inVault,
  disabled,
  onUse,
}: {
  team: TeamDoc;
  player: PlayerDoc;
  challengeKey: string | null;
  usedHints: number;
  inVault: boolean;
  disabled: boolean;
  onUse: (power: NonNullable<ReturnType<typeof useSeasonCards>>[string]['card']['power']) => void;
}) {
  const info = useSeasonCards();
  const card = team.cards?.find((c) => c.episodeId === player.equippedCard);
  const meta = card && info?.[card.episodeId];
  if (!card || !meta) return null;
  const left = cardUsesLeft(card, player.cardUses);
  const power = meta.card.power;
  const effect = cardEffect(power.id);
  const why =
    left <= 0
      ? 'Usos acabaram neste episódio'
      : effect.kind === 'hints'
        ? !challengeKey
          ? 'Usem dentro de um desafio'
          : usedHints >= effect.tier
            ? 'As dicas já estão abertas'
            : null
        : player.cardBoost
          ? 'Já tem um poder guardado'
          : power.id === 'extraPull' && inVault
            ? 'Não há mais cadeados'
            : power.id === 'lightningPlus' && player.progress.vaultSolvedAt
              ? 'O Cofre já foi aberto'
              : null;
  const gold = card.variant === 'dourada';

  return (
    <section aria-label="Carta da missão" className="flex flex-col gap-1">
      <h2 className="font-heist text-xl tracking-wider text-paper">🃏 CARTA DA MISSÃO</h2>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border-[3px] p-1.5',
          gold ? 'border-brass bg-brass/15 glow-brass' : 'border-ink bg-graphite-light',
        )}
      >
        <span className="text-3xl" aria-hidden>
          {powerIcon(power.id)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heist text-lg leading-none tracking-wider text-paper">
            {power.name} {gold && <span className="text-brass">★</span>}
          </p>
          <p className="font-type text-xs text-mist">
            {left} uso{left === 1 ? '' : 's'} · {power.text}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled || !!why}
          title={why ?? power.text}
          onClick={() => onUse(power)}
          className="min-h-11 shrink-0 cursor-pointer border-[3px] border-ink bg-brass px-2 pt-1 font-heist text-lg tracking-wider text-ink hover:glow-brass disabled:cursor-not-allowed disabled:opacity-45"
        >
          Usar
        </button>
      </div>
      {player.cardBoost ? (
        <p className="font-type text-xs text-brass" aria-live="polite">
          {BOOST_TEXT[player.cardBoost]}
        </p>
      ) : (
        why && left > 0 && <p className="font-type text-xs text-mist">{why}</p>
      )}
    </section>
  );
}

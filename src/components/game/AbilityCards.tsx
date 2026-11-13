import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/comic';
import { ABILITY_INFO, SIDE_ABILITIES } from '@/engine/match';
import type { AbilityId, Side } from '@/types/domain';

type Props = {
  side: Side;
  owned: AbilityId[];
  used: AbilityId[];
  disabled?: boolean;
  onUse: (id: AbilityId) => void;
};

/** Habilidades como cartas de baralho escuras com brilho (VISUAL 8.6). Usar = uma vez por episódio. */
export function AbilityCards({ side, owned, used, disabled, onUse }: Props) {
  return (
    <section aria-label="Habilidades especiais" className="flex flex-col gap-2">
      <h2 className="font-heist text-xl tracking-wider text-paper">Habilidades</h2>
      <ul className="grid grid-cols-3 gap-2">
        {SIDE_ABILITIES[side].map((id) => {
          const info = ABILITY_INFO[id];
          const has = owned.includes(id);
          const spent = used.includes(id);
          const usable = has && !spent && !disabled;
          return (
            <li key={id}>
              <AnimatePresence mode="wait">
                <motion.button
                  key={`${id}-${has}`}
                  type="button"
                  initial={has ? { rotateY: 180, scale: 0.6 } : false}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  disabled={!usable}
                  onClick={() => onUse(id)}
                  title={has ? info.text : 'Resolva desafios para ganhar'}
                  aria-label={
                    has
                      ? `${info.name}: ${info.text}${spent ? ' (já usada)' : ''}`
                      : 'Habilidade ainda trancada'
                  }
                  className={cn(
                    'flex h-24 w-full flex-col items-center justify-center gap-1 rounded-md border-[3px] border-ink p-1 text-center',
                    !has && 'bg-graphite-light text-mist opacity-70',
                    has &&
                      !spent &&
                      cn(
                        'cursor-pointer bg-graphite text-paper hover:-translate-y-1',
                        side === 'red' ? 'glow-red' : 'glow-blue',
                      ),
                    spent && 'bg-graphite text-mist line-through opacity-50',
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {has ? info.icon : '🂠'}
                  </span>
                  <span className="font-heist text-sm leading-tight tracking-wide">
                    {has ? info.name : '???'}
                  </span>
                </motion.button>
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/components/comic';
import { CHARACTER_GROUPS, type CharacterGroup } from '@/content/characters';
import type { AvatarConfig } from '@/types/domain';
import { Avatar } from './Avatar';
import { availableCharacters } from './availableCharacters';

const GROUP_LABEL: Record<CharacterGroup, string> = { menina: 'Meninas', menino: 'Meninos' };

/**
 * Escolha de personagem-imagem (pedido da May): a dupla escolhe quem quer ser e vê as duas
 * versões (Bando e Piratas) lado a lado.
 */
export function CharacterPicker({
  value,
  onChange,
}: {
  value: AvatarConfig;
  onChange: (a: AvatarConfig) => void;
}) {
  const all = availableCharacters();
  const groups = CHARACTER_GROUPS.filter((g) => all.some((id) => id.startsWith(g)));
  const [group, setGroup] = useState<CharacterGroup>(
    (value.character?.split('-')[0] as CharacterGroup | undefined) ?? groups[0] ?? 'menina',
  );
  const list = all.filter((id) => id.startsWith(group));

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-8">
      <div>
        {groups.length > 1 && (
          <div role="tablist" aria-label="Personagens" className="mb-3 flex gap-2">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  'min-h-11 cursor-pointer border-[3px] border-ink px-4 pt-1 font-heist text-xl tracking-wider',
                  group === g ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
                )}
              >
                {GROUP_LABEL[g]}
              </button>
            ))}
          </div>
        )}
        <ul className="grid grid-cols-6 gap-3" aria-label="Escolham o personagem">
          {list.map((id, i) => {
            const selected = value.character === id;
            return (
              <li key={id}>
                <motion.button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Personagem ${i + 1}`}
                  onClick={() => onChange({ ...value, character: id })}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, scale: selected ? 1.06 : 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    'flex h-32 w-full cursor-pointer items-end justify-center overflow-hidden rounded-hand border-4 border-ink bg-graphite-light shadow-comic-sm',
                    selected ? 'outline-4 outline-brass glow-brass' : 'hover:glow-brass',
                  )}
                >
                  <Avatar
                    avatar={{ ...value, character: id }}
                    side="red"
                    className="h-full w-full"
                    decorative
                  />
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex gap-4" aria-live="polite">
        {value.character ? (
          (['red', 'blue'] as const).map((s) => (
            <figure key={s} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-60 w-48 items-end justify-center overflow-hidden rounded-hand border-4 border-ink',
                  s === 'red' ? 'bg-bando-dark glow-red' : 'bg-piratas-dark glow-blue',
                )}
              >
                <Avatar avatar={value} side={s} className="h-full w-full" animateOutfit />
              </div>
              <figcaption
                className={cn(
                  'font-heist text-2xl tracking-wider',
                  s === 'red' ? 'text-bando text-glow-red' : 'text-piratas text-glow-blue',
                )}
              >
                {s === 'red' ? '🎭 No Bando' : '⚓ Nos Piratas'}
              </figcaption>
            </figure>
          ))
        ) : (
          <p className="w-64 font-type text-lg text-mist">
            👈 Cliquem num personagem para ver como ele fica no Bando e nos Piratas.
          </p>
        )}
      </div>
    </div>
  );
}

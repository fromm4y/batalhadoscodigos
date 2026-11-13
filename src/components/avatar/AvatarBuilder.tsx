import { useState, type ReactNode } from 'react';
import { cn } from '@/components/comic';
import type { AvatarConfig, Side } from '@/types/domain';
import { Avatar } from './Avatar';
import {
  ACCESSORY_LABELS,
  EYES_LABELS,
  HAIR_COLORS,
  HAIR_LABELS,
  MOUTH_LABELS,
  SKIN_TONES,
  randomAvatar,
} from './avatarOptions';

type Props = { value: AvatarConfig; onChange: (v: AvatarConfig) => void };

/** Criador de avatar com prévia ao vivo e troca de figurino Bando/Piratas (SPEC 9.2, item 3). */
export function AvatarBuilder({ value, onChange }: Props) {
  const [preview, setPreview] = useState<Side | null>(null);
  const set = <K extends keyof AvatarConfig>(k: K, v: AvatarConfig[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid grid-cols-[300px_1fr] gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid h-80 w-72 place-items-center rounded-hand border-4 border-ink bg-graphite-dots shadow-comic">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgb(255_244_194/0.22),transparent_65%)]"
          />
          <Avatar avatar={value} side={preview} animateOutfit className="relative h-72 w-64" />
        </div>
        <div className="flex gap-2" role="group" aria-label="Prévia do figurino">
          {(
            [
              [null, '👕 Sem figurino', 'bg-graphite-light text-paper'],
              ['red', '🎭 Bando', 'bg-bando text-paper'],
              ['blue', '⚓ Piratas', 'bg-piratas text-paper'],
            ] as const
          ).map(([s, label, cls]) => (
            <button
              key={label}
              type="button"
              aria-pressed={preview === s}
              onClick={() => setPreview(s)}
              className={cn(
                'min-h-11 cursor-pointer border-[3px] border-ink px-2 pt-1 font-heist text-lg tracking-wide',
                preview === s ? cls : 'bg-night text-mist hover:text-paper',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(randomAvatar())}
          className="min-h-11 cursor-pointer border-[3px] border-ink bg-brass px-4 pt-1 font-heist text-xl tracking-wider text-ink shadow-comic-sm hover:glow-brass"
        >
          🎲 Sortear visual
        </button>
      </div>

      <div className="grid content-start gap-4">
        <Row title="Tom de pele">
          {SKIN_TONES.map((c, i) => (
            <Swatch
              key={c}
              color={c}
              label={`Tom de pele ${i + 1}`}
              selected={value.skin === i + 1}
              onClick={() => set('skin', (i + 1) as AvatarConfig['skin'])}
            />
          ))}
        </Row>
        <Row title="Cabelo">
          {HAIR_LABELS.map((label, i) => (
            <Thumb
              key={label}
              label={label}
              selected={value.hair === i + 1}
              onClick={() => set('hair', (i + 1) as AvatarConfig['hair'])}
            >
              <Avatar
                avatar={{ ...value, hair: (i + 1) as AvatarConfig['hair'] }}
                className="h-16 w-14"
                decorative
              />
            </Thumb>
          ))}
        </Row>
        <Row title="Cor do cabelo">
          {HAIR_COLORS.map((c, i) => (
            <Swatch
              key={c}
              color={c}
              label={`Cor do cabelo ${i + 1}`}
              selected={value.hairColor === i + 1}
              onClick={() => set('hairColor', (i + 1) as AvatarConfig['hairColor'])}
            />
          ))}
        </Row>
        <div className="grid grid-cols-3 gap-4">
          <Row title="Olhos">
            {EYES_LABELS.map((label, i) => (
              <Thumb
                key={label}
                label={label}
                selected={value.eyes === i + 1}
                onClick={() => set('eyes', (i + 1) as AvatarConfig['eyes'])}
              >
                <FaceCrop>
                  <Avatar
                    avatar={{ ...value, eyes: (i + 1) as AvatarConfig['eyes'] }}
                    decorative
                    className="h-full w-full"
                  />
                </FaceCrop>
              </Thumb>
            ))}
          </Row>
          <Row title="Boca">
            {MOUTH_LABELS.map((label, i) => (
              <Thumb
                key={label}
                label={label}
                selected={value.mouth === i + 1}
                onClick={() => set('mouth', (i + 1) as AvatarConfig['mouth'])}
              >
                <FaceCrop>
                  <Avatar
                    avatar={{ ...value, mouth: (i + 1) as AvatarConfig['mouth'] }}
                    decorative
                    className="h-full w-full"
                  />
                </FaceCrop>
              </Thumb>
            ))}
          </Row>
          <Row title="Acessório">
            {ACCESSORY_LABELS.map((label, i) => (
              <Thumb
                key={label}
                label={label}
                selected={value.accessory === i}
                onClick={() => set('accessory', i as AvatarConfig['accessory'])}
              >
                <Avatar
                  avatar={{ ...value, accessory: i as AvatarConfig['accessory'] }}
                  className="h-16 w-14"
                  decorative
                />
              </Thumb>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 font-heist text-xl tracking-wider text-brass">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Swatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'grid h-12 w-12 cursor-pointer place-items-center rounded-full border-[3px] border-ink transition-transform',
        selected ? 'scale-110 outline-4 outline-brass' : 'hover:scale-105',
      )}
      style={{ background: color }}
    >
      {selected && <span className="text-lg text-paper drop-shadow-[0_0_2px_#000]">✔</span>}
    </button>
  );
}

function Thumb({
  label,
  selected,
  onClick,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'grid min-h-11 cursor-pointer place-items-center overflow-hidden rounded-md border-[3px] bg-graphite-light p-0.5 transition-transform',
        selected ? 'scale-105 border-brass glow-brass' : 'border-ink hover:border-mist',
      )}
    >
      {children}
    </button>
  );
}

/** Recorte no rosto para comparar olhos e bocas. */
function FaceCrop({ children }: { children: ReactNode }) {
  return (
    <span className="block h-12 w-12 overflow-hidden">
      <span className="block h-[110px] w-[92px] -translate-x-[22px] -translate-y-[38px]">
        {children}
      </span>
    </span>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { AvatarConfig, Side } from '@/types/domain';
import { artUrl } from '@/components/comic/artRegistry';
import { cn } from '@/components/comic/cn';
import { characterArtId } from '@/content/characters';
import { HAIR_COLORS, SKIN_TONES } from './avatarOptions';

/**
 * Avatar da dupla em SVG próprio, montado por camadas (SPEC 9.5):
 * cabelo de trás → corpo/figurino → cabeça → olhos → boca → franja → máscara → acessório → chapéu.
 * O mesmo avatar troca de figurino conforme o lado (RN-50). Arte 100% original.
 */
const INK = '#0A0A0A';
const STROKE = {
  stroke: INK,
  strokeWidth: 5,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

const EYE_L = { x: 82, y: 110 };
const EYE_R = { x: 118, y: 110 };

// ---------- Cabelo ----------
const CAP = 'M52 104 Q50 50 100 46 Q150 50 148 104 Q140 76 100 72 Q62 74 52 104 Z';

function HairBack({ style, color }: { style: AvatarConfig['hair']; color: string }) {
  const p = { fill: color, ...STROKE };
  switch (style) {
    case 1:
      return <circle cx={100} cy={92} r={72} {...p} />;
    case 2:
      return (
        <g {...p}>
          {[
            [56, 124, 20],
            [144, 124, 20],
            [58, 90, 26],
            [142, 90, 26],
            [70, 58, 28],
            [130, 58, 28],
            [100, 46, 30],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case 4:
      return (
        <path
          d="M50 100 Q48 40 100 40 Q152 40 150 100 L156 200 Q130 212 100 210 Q70 212 44 200 Z"
          {...p}
        />
      );
    case 5:
      return (
        <g {...p}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx={50} cy={118 + i * 20} rx={9} ry={12} />
              <ellipse cx={150} cy={118 + i * 20} rx={9} ry={12} />
            </g>
          ))}
        </g>
      );
    case 6:
      return <circle cx={100} cy={38} r={22} {...p} />;
    case 7:
      return <path d="M138 66 Q184 76 174 156 Q164 126 146 104 Z" {...p} />;
    default:
      return null;
  }
}

function HairFront({ style, color }: { style: AvatarConfig['hair']; color: string }) {
  const p = { fill: color, ...STROKE };
  switch (style) {
    case 1:
      return (
        <path
          d="M50 102 Q44 58 70 48 Q84 30 100 40 Q118 28 132 46 Q158 56 150 102 Q140 74 100 70 Q60 74 50 102 Z"
          {...p}
        />
      );
    case 2:
      return (
        <g {...p}>
          {[
            [64, 80, 14],
            [80, 68, 15],
            [100, 64, 16],
            [120, 68, 15],
            [136, 80, 14],
          ].map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} />
          ))}
        </g>
      );
    case 4:
      return (
        <path d="M52 104 Q50 48 100 46 Q150 48 148 104 Q132 70 96 74 Q70 80 60 116 Z" {...p} />
      );
    case 5:
      return (
        <g>
          <path d={CAP} {...p} />
          <path d="M100 48 L100 72" stroke={INK} strokeWidth={3} />
        </g>
      );
    case 8:
      return (
        <path
          d="M55 96 Q55 54 100 50 Q145 54 145 96 Q138 74 100 70 Q62 74 55 96 Z"
          fill={color}
          fillOpacity={0.85}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      );
    default:
      return <path d={CAP} {...p} />;
  }
}

// ---------- Rosto ----------
function Eyes({ style }: { style: AvatarConfig['eyes'] }) {
  return (
    <g>
      {[EYE_L, EYE_R].map((e, i) => {
        switch (style) {
          case 2:
            return (
              <path
                key={i}
                d={`M${e.x - 8} ${e.y + 3} q8 -10 16 0`}
                fill="none"
                {...STROKE}
                strokeWidth={4}
              />
            );
          case 3:
            return (
              <g key={i}>
                <ellipse
                  cx={e.x}
                  cy={e.y}
                  rx={8.5}
                  ry={9.5}
                  fill="#fff"
                  stroke={INK}
                  strokeWidth={3}
                />
                <circle cx={e.x + 1} cy={e.y + 1} r={5} fill={INK} />
                <circle cx={e.x + 3} cy={e.y - 2} r={2} fill="#fff" />
              </g>
            );
          case 4:
            return (
              <g key={i}>
                <circle cx={e.x} cy={e.y + 1} r={5.5} fill={INK} />
                <path
                  d={i === 0 ? `M${e.x - 9} ${e.y - 10} l17 4` : `M${e.x + 9} ${e.y - 10} l-17 4`}
                  stroke={INK}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              </g>
            );
          default:
            return <circle key={i} cx={e.x} cy={e.y} r={6} fill={INK} />;
        }
      })}
    </g>
  );
}

function Mouth({ style }: { style: AvatarConfig['mouth'] }) {
  switch (style) {
    case 2:
      return (
        <g>
          <path d="M83 134 Q100 156 117 134 Z" fill="#5a1414" {...STROKE} strokeWidth={4} />
          <path d="M88 136 H112" stroke="#fff" strokeWidth={3} />
        </g>
      );
    case 3:
      return (
        <ellipse cx={100} cy={140} rx={6} ry={7.5} fill="#5a1414" stroke={INK} strokeWidth={4} />
      );
    case 4:
      return <path d="M88 142 Q102 146 114 134" fill="none" {...STROKE} strokeWidth={4} />;
    default:
      return <path d="M86 135 Q100 148 114 135" fill="none" {...STROKE} strokeWidth={4} />;
  }
}

// ---------- Acessórios ----------
function Accessory({ kind }: { kind: AvatarConfig['accessory'] }) {
  switch (kind) {
    case 1:
      return (
        <g fill="rgb(255 255 255 / 0.18)" stroke={INK} strokeWidth={4}>
          <circle cx={EYE_L.x} cy={EYE_L.y} r={13} />
          <circle cx={EYE_R.x} cy={EYE_R.y} r={13} />
          <path d="M95 109 Q100 104 105 109" fill="none" />
        </g>
      );
    case 2:
      return (
        <g {...STROKE}>
          <path
            d="M47 112 Q44 32 100 30 Q156 32 153 112"
            fill="none"
            stroke={INK}
            strokeWidth={10}
          />
          <path
            d="M47 112 Q44 32 100 30 Q156 32 153 112"
            fill="none"
            stroke="#252B3A"
            strokeWidth={5}
          />
          <rect x={36} y={98} width={18} height={32} rx={7} fill="#252B3A" />
          <rect x={146} y={98} width={18} height={32} rx={7} fill="#252B3A" />
          <circle cx={45} cy={114} r={4} fill="#D4A537" stroke="none" />
          <circle cx={155} cy={114} r={4} fill="#D4A537" stroke="none" />
        </g>
      );
    case 3:
      return (
        <g {...STROKE} strokeWidth={4}>
          <path d="M52 86 Q100 66 148 86 L148 98 Q100 80 52 98 Z" fill="#2BB673" />
          <path d="M148 88 l16 -8 l-4 14 z M148 94 l14 10 l-14 2 z" fill="#2BB673" />
          <circle cx={78} cy={84} r={2.5} fill="#EDE3CC" stroke="none" />
          <circle cx={118} cy={82} r={2.5} fill="#EDE3CC" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

// ---------- Figurinos (RN-50) ----------
const BODY = 'M40 240 Q40 180 100 178 Q160 180 160 240 Z';

function Outfit({ side }: { side: Side | null }) {
  if (side === 'red') {
    return (
      <g {...STROKE}>
        <path d={BODY} fill="#E63946" />
        <path d="M68 184 L100 212 L132 184" fill="#C42E3A" />
        <path d="M100 212 V240" />
        <circle cx={100} cy={222} r={3} fill="#D4A537" stroke="none" />
      </g>
    );
  }
  if (side === 'blue') {
    return (
      <g {...STROKE}>
        <path d={BODY} fill="#EDE3CC" />
        <path
          d="M40 240 Q40 184 86 179 L86 240 Z M160 240 Q160 184 114 179 L114 240 Z"
          fill="#2F6BFF"
        />
        <path d="M80 180 L100 204 L120 180 Z" fill="#E8D16B" />
      </g>
    );
  }
  return <path d={BODY} fill="#3A4256" {...STROKE} />;
}

/** Máscara de olhos simples (tipo dominó), com furos que deixam ver os olhos escolhidos. */
function Mask() {
  const hole = (x: number) => `M${x - 11} 110 a11 9 0 1 0 22 0 a11 9 0 1 0 -22 0 Z`;
  return (
    <path
      fillRule="evenodd"
      d={`M48 108 Q50 88 80 89 Q92 90 100 98 Q108 90 120 89 Q150 88 152 108 Q148 128 120 128 Q108 128 100 120 Q92 128 80 128 Q52 128 48 108 Z ${hole(EYE_L.x)} ${hole(EYE_R.x)}`}
      fill="#E63946"
      stroke={INK}
      strokeWidth={4}
      strokeLinejoin="round"
      style={{ filter: 'drop-shadow(0 0 4px rgb(230 57 70 / 0.6))' }}
    />
  );
}

/** Chapéu de palha com fita AZUL (nunca vermelha: regra de direitos do CLAUDE.md). */
function StrawHat() {
  return (
    <g {...STROKE}>
      <ellipse cx={100} cy={66} rx={80} ry={16} fill="#E8C66A" />
      <path d="M58 64 Q60 18 100 18 Q140 18 142 64 Z" fill="#E8C66A" />
      <path d="M59 54 Q100 64 141 54 L142 64 Q100 74 58 64 Z" fill="#2F6BFF" strokeWidth={4} />
      <path
        d="M70 38 Q100 30 130 38 M66 46 Q100 40 134 46"
        fill="none"
        stroke="#B8923A"
        strokeWidth={2}
      />
    </g>
  );
}

type AvatarProps = {
  avatar: AvatarConfig;
  side?: Side | null;
  className?: string;
  /** Anima a troca de figurino (tela "Vista o uniforme"). */
  animateOutfit?: boolean;
  title?: string;
  /** Só enfeite (ex.: miniatura dentro de um botão já rotulado). */
  decorative?: boolean;
};

function Layer({ id, animate, children }: { id: string; animate: boolean; children: ReactNode }) {
  if (!animate) return <g>{children}</g>;
  return (
    <motion.g
      key={id}
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      {children}
    </motion.g>
  );
}

export function Avatar({
  avatar,
  side = null,
  className,
  animateOutfit = false,
  title = 'Avatar da dupla',
  decorative = false,
}: AvatarProps) {
  // Personagem-imagem (se a arte já existe); senão, o desenho em SVG.
  const pic = avatar.character ? artUrl(characterArtId(avatar.character, side)) : undefined;
  if (pic) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.img
          key={pic}
          src={pic}
          draggable={false}
          initial={animateOutfit ? { opacity: 0, scale: 0.9 } : false}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className={cn('object-contain object-bottom', className)}
          {...(decorative ? { alt: '', 'aria-hidden': true } : { alt: title })}
        />
      </AnimatePresence>
    );
  }
  const skin = SKIN_TONES[avatar.skin - 1] ?? SKIN_TONES[0];
  const hair = HAIR_COLORS[avatar.hairColor - 1] ?? HAIR_COLORS[0];
  const hatOn = side === 'blue';
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title })}
    >
      <HairBack style={avatar.hair} color={hair} />
      <AnimatePresence mode="wait" initial={false}>
        <Layer key={`body-${side}`} id={`body-${side}`} animate={animateOutfit}>
          <Outfit side={side} />
        </Layer>
      </AnimatePresence>
      <rect x={86} y={150} width={28} height={32} fill={skin} {...STROKE} />
      <ellipse cx={52} cy={112} rx={8} ry={11} fill={skin} {...STROKE} />
      <ellipse cx={148} cy={112} rx={8} ry={11} fill={skin} {...STROKE} />
      <ellipse cx={100} cy={108} rx={48} ry={54} fill={skin} {...STROKE} />
      <circle cx={72} cy={128} r={7} fill="#E8737A" opacity={0.28} />
      <circle cx={128} cy={128} r={7} fill="#E8737A" opacity={0.28} />
      <Eyes style={avatar.eyes} />
      <Mouth style={avatar.mouth} />
      <HairFront style={avatar.hair} color={hair} />
      <AnimatePresence initial={false}>
        {side === 'red' && (
          <Layer key="mask" id="mask" animate={animateOutfit}>
            <Mask />
          </Layer>
        )}
      </AnimatePresence>
      <Accessory kind={avatar.accessory} />
      <AnimatePresence initial={false}>
        {hatOn && (
          <Layer key="hat" id="hat" animate={animateOutfit}>
            <StrawHat />
          </Layer>
        )}
      </AnimatePresence>
    </svg>
  );
}

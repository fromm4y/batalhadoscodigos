import { AnimatePresence, motion } from 'framer-motion';
import type { AvatarConfig, Side } from '@/types/domain';

/**
 * PROTÓTIPO de avatar em camadas (pele → olhos → boca → cabelo → acessório → figurino).
 * O criador completo (todas as peças da seção 9.5) chega na Etapa 2.
 */
const SKIN = ['#F6D2B6', '#E8B48F', '#C98C62', '#A06A43', '#7A4A2A', '#4E2E1A'];
const HAIR = ['#1b1410', '#4a2f1d', '#8a5a2b', '#d9a441', '#7a2e2e'];

export function AvatarPreview({
  avatar,
  side,
  className,
}: {
  avatar: AvatarConfig;
  side: Side | null;
  className?: string;
}) {
  const skin = SKIN[avatar.skin - 1] ?? SKIN[0];
  const hair = HAIR[avatar.hairColor - 1] ?? HAIR[0];
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label="Avatar da dupla">
      <g stroke="#0A0A0A" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        {/* corpo base */}
        <path d="M40 240 q0 -60 60 -62 q60 2 60 62 z" fill="#3a4256" />
        <rect x="86" y="150" width="28" height="30" fill={skin} />
        {/* cabelo de trás (crespo volumoso) */}
        {avatar.hair % 2 === 1 && <circle cx="100" cy="92" r="66" fill={hair} />}
        {/* cabeça */}
        <ellipse cx="100" cy="105" rx="50" ry="56" fill={skin} />
        {/* olhos */}
        <circle cx="80" cy="108" r="6" fill="#0A0A0A" stroke="none" />
        <circle cx="120" cy="108" r="6" fill="#0A0A0A" stroke="none" />
        {/* boca */}
        <path d="M84 135 q16 14 32 0" fill="none" strokeWidth="4" />
        {/* franja */}
        <path d="M52 92 q10 -50 60 -46 q40 4 38 46 q-30 -22 -98 0z" fill={hair} />
      </g>
      <AnimatePresence mode="wait">
        {side === 'red' && (
          <motion.g
            key="red"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            stroke="#0A0A0A"
            strokeWidth="5"
            strokeLinejoin="round"
          >
            {/* macacão vermelho com gola e capuz */}
            <path d="M40 240 q0 -60 60 -62 q60 2 60 62 z" fill="#E63946" />
            <path d="M70 186 l30 26 l30 -26" fill="none" />
            <line x1="100" y1="212" x2="100" y2="240" />
            {/* máscara de olhos simples (dominó) */}
            <path
              d="M54 104 q4 -16 26 -14 q12 2 20 10 q8 -8 20 -10 q22 -2 26 14 q-6 16 -26 14 q-12 -2 -20 -8 q-8 6 -20 8 q-20 2 -26 -14z"
              fill="#E63946"
              style={{ filter: 'drop-shadow(0 0 6px rgb(230 57 70 / 0.7))' }}
            />
            <ellipse cx="80" cy="106" rx="8" ry="6" fill="#0A0A0A" stroke="none" />
            <ellipse cx="120" cy="106" rx="8" ry="6" fill="#0A0A0A" stroke="none" />
            <circle cx="82" cy="104" r="2" fill="#fff" stroke="none" />
            <circle cx="122" cy="104" r="2" fill="#fff" stroke="none" />
          </motion.g>
        )}
        {side === 'blue' && (
          <motion.g
            key="blue"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
            stroke="#0A0A0A"
            strokeWidth="5"
            strokeLinejoin="round"
          >
            {/* colete azul + lenço */}
            <path d="M40 240 q0 -60 60 -62 q60 2 60 62 z" fill="#EDE3CC" />
            <path d="M40 240 q0 -56 46 -60 l0 60z M160 240 q0 -56 -46 -60 l0 60z" fill="#2F6BFF" />
            <path d="M80 180 l20 22 l20 -22 z" fill="#E8D16B" />
            {/* chapéu de palha com fita AZUL */}
            <ellipse cx="100" cy="66" rx="78" ry="16" fill="#E8C66A" />
            <path d="M58 64 q2 -46 42 -46 q40 0 42 46 z" fill="#E8C66A" />
            <path d="M59 56 q41 10 82 0 l1 10 q-42 10 -84 0z" fill="#2F6BFF" />
            <g stroke="#b8923a" strokeWidth="2" fill="none">
              <path d="M70 40 q30 -8 60 0 M66 48 q34 -6 68 0" />
            </g>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

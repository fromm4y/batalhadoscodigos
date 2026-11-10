import { motion, useReducedMotion } from 'framer-motion';

/** O Robô (oponente máquina) em SVG: lata retrô com antena e tela no rosto. Original. */
export function RobotFigure({
  className,
  mood = 'provocando',
}: {
  className?: string;
  mood?: 'provocando' | 'derrotado';
}) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 200 240"
      className={className}
      aria-label="O Robô"
      role="img"
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g stroke="#0A0A0A" strokeWidth="5" strokeLinejoin="round">
        <line x1="100" y1="22" x2="100" y2="50" />
        <circle
          cx="100"
          cy="18"
          r="9"
          fill="#E63946"
          style={{ filter: 'drop-shadow(0 0 6px #E63946)' }}
        />
        <rect x="45" y="50" width="110" height="90" rx="14" fill="#9aa3b8" />
        <rect x="58" y="64" width="84" height="56" rx="6" fill="#0B0D14" />
        {mood === 'provocando' ? (
          <g
            stroke="#2BB673"
            strokeWidth="5"
            fill="none"
            style={{ filter: 'drop-shadow(0 0 4px #2BB673)' }}
          >
            <path d="M70 88 l10 -8 l10 8" />
            <path d="M110 84 h20" />
            <path d="M76 106 q24 10 48 -2" />
          </g>
        ) : (
          <g stroke="#FF8C00" strokeWidth="4" fill="none">
            <path d="M74 86 a8 8 0 1 1 12 4 M114 86 a8 8 0 1 1 12 4" />
            <path d="M80 110 h40" />
          </g>
        )}
        <rect x="35" y="80" width="12" height="28" rx="4" fill="#6b7280" />
        <rect x="153" y="80" width="12" height="28" rx="4" fill="#6b7280" />
        <rect x="60" y="146" width="80" height="70" rx="10" fill="#6b7280" />
        <circle cx="85" cy="170" r="7" fill="#D4A537" />
        <circle cx="115" cy="170" r="7" fill="#2F6BFF" />
        <rect x="80" y="190" width="40" height="10" rx="3" fill="#252B3A" />
        <path d="M60 160 q-30 -10 -30 -40" fill="none" strokeWidth="9" stroke="#6b7280" />
        <path d="M140 160 q34 0 40 -40" fill="none" strokeWidth="9" stroke="#6b7280" />
      </g>
    </motion.svg>
  );
}

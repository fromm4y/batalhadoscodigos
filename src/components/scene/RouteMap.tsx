import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/components/comic';

/**
 * Trilha de progresso (VISUAL.md §8.5): planta do museu (Bando) ou carta náutica (Piratas).
 * 3 pontos = 3 cadeados, e o destino = Cofre (Bando) / X do tesouro (Piratas).
 * Cada cadeado aberto acende o ponto e avança a rota.
 */
export type RouteTheme = 'bando' | 'piratas';

type Pt = { x: number; y: number };
const START: Pt = { x: 50, y: 350 };
const STOPS: Pt[] = [
  { x: 150, y: 270 },
  { x: 290, y: 170 },
  { x: 440, y: 270 },
];
const GOAL: Pt = { x: 545, y: 105 };

const SEGMENTS = [START, ...STOPS, GOAL];
function seg(a: Pt, b: Pt, bend: number): string {
  const mx = (a.x + b.x) / 2 + bend;
  const my = (a.y + b.y) / 2 - Math.abs(bend);
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
}
const BENDS = [-20, 30, -25, 25];

type RouteMapProps = {
  theme: RouteTheme;
  /** Cadeados abertos (0 a 3). */
  opened: number;
  goalReached?: boolean;
  /** Versão compacta para a coluna lateral do jogo. */
  compact?: boolean;
  className?: string;
};

export function RouteMap({
  theme,
  opened,
  goalReached = false,
  compact,
  className,
}: RouteMapProps) {
  const reduce = useReducedMotion();
  const bando = theme === 'bando';
  const accent = bando ? '#E63946' : '#2F6BFF';
  const line = bando ? 'rgb(150 175 210 / 0.55)' : 'rgb(91 67 33 / 0.55)';
  const labelColor = bando ? '#C9D4E8' : '#3b2a12';
  const stopLabel = bando ? 'CADEADO' : 'DEFESA';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-hand border-4 border-ink shadow-comic',
        bando ? 'bg-blueprint' : 'bg-nautical',
        className,
      )}
    >
      <svg
        viewBox="0 0 600 400"
        className="block h-full w-full"
        role="img"
        aria-label={`${bando ? 'Planta do museu' : 'Carta náutica'}: ${opened} de 3 ${bando ? 'cadeados abertos' : 'defesas montadas'}`}
      >
        {bando ? (
          <BlueprintDetails line={line} label={labelColor} />
        ) : (
          <ChartDetails line={line} label={labelColor} />
        )}

        {/* Rota completa, apagada */}
        {SEGMENTS.slice(0, -1).map((a, i) => (
          <path
            key={`ghost-${i}`}
            d={seg(a, SEGMENTS[i + 1]!, BENDS[i]!)}
            fill="none"
            stroke={accent}
            strokeOpacity={0.25}
            strokeWidth={4}
            strokeDasharray="10 9"
          />
        ))}
        {/* Rota percorrida, acesa */}
        {SEGMENTS.slice(0, -1).map((a, i) =>
          i < opened || (i === 3 && goalReached) ? (
            <motion.path
              key={`lit-${i}`}
              d={seg(a, SEGMENTS[i + 1]!, BENDS[i]!)}
              fill="none"
              stroke={accent}
              strokeWidth={5}
              strokeDasharray="10 9"
              style={{ filter: `drop-shadow(0 0 5px ${accent})` }}
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: 'easeInOut' }}
            />
          ) : null,
        )}

        {/* Ponto de partida */}
        <circle cx={START.x} cy={START.y} r={9} fill={accent} stroke="#0A0A0A" strokeWidth={3} />
        <text
          x={START.x - 10}
          y={START.y + 32}
          fill={labelColor}
          fontFamily="Special Elite"
          fontSize={15}
        >
          {bando ? 'ENTRADA' : 'PORTO'}
        </text>

        {/* Pontos dos cadeados */}
        {STOPS.map((p, i) => {
          const state = i < opened ? 'open' : i === opened ? 'now' : 'locked';
          return (
            <g key={i}>
              {state === 'now' && !reduce && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r={22}
                  fill="none"
                  stroke={accent}
                  strokeWidth={3}
                  animate={{ r: [22, 34], opacity: [0.9, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={22}
                fill={state === 'open' ? accent : bando ? '#171B26' : '#EDE3CC'}
                stroke={state === 'locked' ? '#6b7280' : '#0A0A0A'}
                strokeWidth={4}
                style={state === 'open' ? { filter: `drop-shadow(0 0 10px ${accent})` } : undefined}
              />
              <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize={22}>
                {state === 'open' ? '✔' : state === 'now' ? (bando ? '🔓' : '⚓') : '🔒'}
              </text>
              <text
                x={p.x}
                y={p.y + 46}
                textAnchor="middle"
                fill={labelColor}
                fontFamily="Bebas Neue"
                fontSize={20}
                letterSpacing={2}
              >
                {stopLabel} {i + 1}
              </text>
            </g>
          );
        })}

        {/* Destino: Cofre ou X */}
        {bando ? (
          <g style={goalReached ? { filter: 'drop-shadow(0 0 14px #D4A537)' } : undefined}>
            <circle
              cx={GOAL.x}
              cy={GOAL.y}
              r={34}
              fill="#252B3A"
              stroke="#D4A537"
              strokeWidth={5}
            />
            <circle
              cx={GOAL.x}
              cy={GOAL.y}
              r={20}
              fill="none"
              stroke="#D4A537"
              strokeWidth={3}
              strokeDasharray="4 4"
            />
            <circle cx={GOAL.x} cy={GOAL.y} r={6} fill="#D4A537" />
          </g>
        ) : (
          <g
            stroke="#E63946"
            strokeWidth={10}
            strokeLinecap="round"
            style={{
              filter: goalReached
                ? 'drop-shadow(0 0 12px #D4A537)'
                : 'drop-shadow(2px 2px 0 #0A0A0A)',
            }}
          >
            <line x1={GOAL.x - 22} y1={GOAL.y - 22} x2={GOAL.x + 22} y2={GOAL.y + 22} />
            <line x1={GOAL.x + 22} y1={GOAL.y - 22} x2={GOAL.x - 22} y2={GOAL.y + 22} />
          </g>
        )}
        <text
          x={GOAL.x}
          y={GOAL.y + 62}
          textAnchor="middle"
          fill={bando ? '#D4A537' : '#7a1a1a'}
          fontFamily="Bebas Neue"
          fontSize={compact ? 26 : 24}
          letterSpacing={3}
        >
          {bando ? 'O COFRE' : 'O TESOURO'}
        </text>
      </svg>
    </div>
  );
}

function BlueprintDetails({ line, label }: { line: string; label: string }) {
  return (
    <g fill="none" stroke={line} strokeWidth={2}>
      {/* Salas do museu */}
      <rect x={20} y={20} width={560} height={360} strokeWidth={4} />
      <path d="M20 220 H220 V380 M220 220 V20 M220 120 H380 V20 M380 120 V300 H580 M380 300 V380" />
      {/* Portas */}
      <path d="M90 220 a24 24 0 0 1 24 -24 M300 120 a20 20 0 0 0 20 20 M470 300 a22 22 0 0 1 22 -22" />
      {/* Vitrines */}
      <rect x={260} y={200} width={60} height={34} strokeDasharray="4 4" />
      <rect x={60} y={60} width={110} height={40} strokeDasharray="4 4" />
      <rect x={420} y={180} width={50} height={50} strokeDasharray="4 4" />
      <g fill={label} stroke="none" fontFamily="Special Elite" fontSize={13} opacity={0.8}>
        <text x={36} y={46}>
          ALA DAS ENGRENAGENS
        </text>
        <text x={236} y={46}>
          SALA DOS CARTÕES
        </text>
        <text x={396} y={46}>
          COFRE CENTRAL
        </text>
        <text x={500} y={370}>
          DEPÓSITO
        </text>
      </g>
      {/* Câmeras */}
      <g fill="#E63946" stroke="none">
        <circle cx={210} cy={30} r={4} />
        <circle cx={570} cy={290} r={4} />
        <circle cx={30} cy={370} r={4} />
      </g>
    </g>
  );
}

function ChartDetails({ line, label }: { line: string; label: string }) {
  return (
    <g>
      {/* Ilhas e contornos */}
      <g fill="rgb(160 130 70 / 0.35)" stroke={line} strokeWidth={2}>
        <path d="M60 60 q40 -30 90 0 q30 30 -10 50 q-60 20 -80 -50z" />
        <path d="M330 290 q50 -30 100 -5 q30 40 -30 60 q-80 10 -70 -55z" />
        <path d="M470 40 q50 -10 80 20 q-10 40 -60 40 q-40 -20 -20 -60z" />
      </g>
      {/* Ondinhas */}
      <g fill="none" stroke="rgb(47 107 255 / 0.4)" strokeWidth={2}>
        <path d="M200 70 q10 -8 20 0 t20 0 M90 200 q10 -8 20 0 t20 0 M480 200 q10 -8 20 0 t20 0 M250 360 q10 -8 20 0 t20 0" />
      </g>
      {/* Rosa dos ventos */}
      <g transform="translate(110 150)" stroke="#5b4321" strokeWidth={1.5}>
        <circle r={38} fill="none" />
        <circle r={30} fill="none" strokeDasharray="2 3" />
        <path d="M0 -44 L7 -7 L44 0 L7 7 L0 44 L-7 7 L-44 0 L-7 -7 Z" fill="rgb(91 67 33 / 0.35)" />
        <path d="M0 -44 L7 -7 L0 0 Z" fill="#E63946" />
        <text
          y={-50}
          textAnchor="middle"
          fontFamily="Bebas Neue"
          fontSize={16}
          fill={label}
          stroke="none"
        >
          N
        </text>
      </g>
      <g fill={label} fontFamily="Special Elite" fontSize={13} opacity={0.75}>
        <text x={330} y={40}>
          MAR DAS ENGRENAGENS
        </text>
        <text x={190} y={385}>
          BAÍA DO MUSEU
        </text>
      </g>
    </g>
  );
}

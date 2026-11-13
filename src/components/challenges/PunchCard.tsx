import { motion, useReducedMotion } from 'framer-motion';

const COL_W = 64;
const ROW_H = 24;
const PAD_X = 48;
const PAD_TOP = 30;
const PAD_BOTTOM = 18;

type PunchCardProps = {
  rows: number;
  /** linha furada de cada coluna (null = sem furo) */
  holes: (number | null)[];
  /** coluna que depende da Narradora: rasgada (leitura) ou molhada (escrita) */
  spokenColumn: number;
  spokenStyle: 'torn' | 'wet';
  /** a coluna da Narradora já foi liberada (transmissão ouvida) */
  spokenUnlocked?: boolean;
  /** modo escrita: clicar numa casa fura a coluna */
  onPunch?: (col: number, row: number) => void;
  disabled?: boolean;
  label: string;
};

/** Cartão perfurado em SVG: 10 linhas (0–9), um furo por coluna (SPEC 11.2, 12.1). */
export function PunchCard({
  rows,
  holes,
  spokenColumn,
  spokenStyle,
  spokenUnlocked = false,
  onPunch,
  disabled,
  label,
}: PunchCardProps) {
  const reduce = useReducedMotion();
  const cols = holes.length;
  const width = PAD_X + cols * COL_W + 24;
  const height = PAD_TOP + rows * ROW_H + PAD_BOTTOM;
  const x = (c: number) => PAD_X + c * COL_W;
  const y = (r: number) => PAD_TOP + r * ROW_H;
  const hidden = (c: number) => c === spokenColumn && !spokenUnlocked;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full max-w-[30rem]"
      role="group"
      aria-label={label}
    >
      <defs>
        <filter id="pc-shadow">
          <feDropShadow dx="4" dy="5" stdDeviation="0" floodColor="#000" />
        </filter>
      </defs>
      {/* cartão com canto cortado */}
      <path
        d={`M24 0 H${width} V${height} H0 V24 Z`}
        fill="#EDE3CC"
        stroke="#0A0A0A"
        strokeWidth={4}
        filter="url(#pc-shadow)"
      />
      {/* números das linhas */}
      {Array.from({ length: rows }, (_, r) => (
        <text
          key={r}
          x={20}
          y={y(r) + ROW_H * 0.68}
          fontFamily="Bebas Neue"
          fontSize={20}
          fill="#5b4321"
        >
          {r}
        </text>
      ))}
      {holes.map((hole, c) => (
        <g key={c}>
          <text
            x={x(c) + COL_W / 2}
            y={22}
            textAnchor="middle"
            fontFamily="Special Elite"
            fontSize={13}
            fill="#5b4321"
          >
            col {c + 1}
          </text>
          {Array.from({ length: rows }, (_, r) => {
            const punched = hole === r && !hidden(c);
            const clickable = !!onPunch && !disabled && !hidden(c);
            return (
              <g key={r}>
                {clickable && (
                  <rect
                    x={x(c) + 6}
                    y={y(r) + 2}
                    width={COL_W - 12}
                    height={ROW_H - 4}
                    fill="transparent"
                    className="cursor-pointer hover:fill-[rgb(212_165_55/0.35)]"
                    role="button"
                    aria-label={`Furar coluna ${c + 1}, linha ${r}`}
                    aria-pressed={punched}
                    tabIndex={0}
                    onClick={() => onPunch?.(c, r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPunch?.(c, r);
                      }
                    }}
                  />
                )}
                {punched ? (
                  <motion.rect
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ transformOrigin: `${x(c) + COL_W / 2}px ${y(r) + ROW_H / 2}px` }}
                    x={x(c) + 16}
                    y={y(r) + 6}
                    width={COL_W - 32}
                    height={ROW_H - 12}
                    rx={4}
                    fill="#0B0D14"
                    pointerEvents="none"
                  />
                ) : (
                  <text
                    x={x(c) + COL_W / 2}
                    y={y(r) + ROW_H * 0.68}
                    textAnchor="middle"
                    fontFamily="Special Elite"
                    fontSize={14}
                    fill="rgb(91 67 33 / 0.45)"
                    pointerEvents="none"
                  >
                    {r}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}

      {/* coluna rasgada (leitura) ou molhada (escrita) até a transmissão */}
      {hidden(spokenColumn) &&
        (spokenStyle === 'torn' ? (
          <g>
            <path
              d={`M${x(spokenColumn) - 4} ${PAD_TOP - 30} ${Array.from({ length: 14 }, (_, i) => `L${x(spokenColumn) + (i % 2 ? 8 : -4)} ${PAD_TOP - 30 + i * 24}`).join(' ')} L${x(spokenColumn) + COL_W + 30} ${height + 2} L${x(spokenColumn) + COL_W + 30} ${PAD_TOP - 30} Z`}
              fill="#0B0D14"
            />
          </g>
        ) : (
          <g>
            <rect
              x={x(spokenColumn) + 2}
              y={PAD_TOP}
              width={COL_W - 4}
              height={rows * ROW_H}
              fill="rgb(47 107 255 / 0.25)"
              stroke="rgb(47 107 255 / 0.6)"
              strokeDasharray="6 4"
            />
            {[0.2, 0.45, 0.7].map((f) => (
              <text
                key={f}
                x={x(spokenColumn) + COL_W / 2}
                y={PAD_TOP + rows * ROW_H * f}
                textAnchor="middle"
                fontSize={22}
              >
                💧
              </text>
            ))}
          </g>
        ))}
    </svg>
  );
}

/** Legenda letras ↔ números (nível C). */
export function LetterLegend() {
  return <p className="font-type text-sm">1=A · 2=B · 3=C · 4=D · 5=E · 6=F · 7=G · 8=H · 9=I</p>;
}

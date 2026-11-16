import { useRef, useState } from 'react';
import { cn } from '@/components/comic';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const STEP = 360 / 26;
const C = 150; // centro do SVG
const mod26 = (n: number) => ((n % 26) + 26) % 26;

/**
 * Disco de cifra do Ep. 2 (SPEC-03 §1): o anel de FORA (fixo) é o texto original; o de DENTRO
 * (gira) é o texto cifrado. Na chave k, embaixo do A aparece a letra k casas à frente.
 * Gira arrastando, pelos botões ou pelo teclado (setas). `locked`: disco travado (preset ou
 * esperando a transmissão).
 */
export function CipherWheel({
  value,
  onChange,
  locked,
  hideKey,
  size = 220,
}: {
  value: number;
  onChange: (k: number) => void;
  locked: boolean;
  /** esconde o número no centro (chave pela transmissão, antes de ouvir) */
  hideKey?: boolean;
  size?: number;
}) {
  // posição sem "volta": girar de 25 para 0 não dá uma volta inteira para trás
  const [pos, setPos] = useState(value);
  if (mod26(pos) !== value) setPos(value);
  const drag = useRef<{ startAngle: number; startPos: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function turn(next: number) {
    if (locked) return;
    setPos(next);
    onChange(mod26(next));
  }

  function angleOf(e: React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect();
    return (
      (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) /
      Math.PI
    );
  }

  const ring = (radius: number, rotate: number, inner: boolean) => (
    <g
      style={{ transform: `rotate(${rotate}deg)`, transformOrigin: `${C}px ${C}px` }}
      className="motion-safe:transition-transform motion-safe:duration-200"
    >
      {[...ABC].map((ch, i) => (
        <text
          key={ch}
          x={C}
          y={C - radius}
          transform={`rotate(${i * STEP} ${C} ${C})`}
          textAnchor="middle"
          dominantBaseline="middle"
          className={cn('font-heist', inner ? 'fill-ink' : 'fill-paper')}
          fontSize={inner ? 20 : 22}
        >
          {ch}
        </text>
      ))}
    </g>
  );

  const k = mod26(pos);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        width={size}
        height={size}
        role="slider"
        tabIndex={locked ? -1 : 0}
        aria-label="Disco de cifra: girem para escolher a chave"
        aria-valuemin={0}
        aria-valuemax={25}
        aria-valuenow={hideKey ? undefined : k}
        aria-valuetext={hideKey ? 'chave pela transmissão' : `chave ${k}: A vira ${ABC[k]}`}
        aria-disabled={locked}
        className={cn(
          'touch-none select-none rounded-full outline-offset-4',
          locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        )}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') turn(pos + 1);
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') turn(pos - 1);
          else return;
          e.preventDefault();
        }}
        onPointerDown={(e) => {
          if (locked) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { startAngle: angleOf(e), startPos: pos };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          let delta = angleOf(e) - d.startAngle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          // girar o anel de dentro no sentido horário traz letras "de trás": a chave diminui
          const next = d.startPos - Math.round(delta / STEP);
          if (next !== pos) turn(next);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        {/* anel de fora: original (fixo) */}
        <circle cx={C} cy={C} r={146} className="fill-graphite stroke-ink" strokeWidth={4} />
        {/* anel de dentro: cifrado (gira) */}
        <circle cx={C} cy={C} r={106} className="fill-[#c9a45a] stroke-ink" strokeWidth={4} />
        <circle cx={C} cy={C} r={70} className="fill-graphite stroke-ink" strokeWidth={4} />
        {/* janela de leitura no topo: A (fora) → letra cifrada (dentro) */}
        <rect
          x={C - 16}
          y={4}
          width={32}
          height={100}
          rx={6}
          className="fill-none stroke-spotlight"
          strokeWidth={3}
        />
        {ring(126, 0, false)}
        {ring(88, -pos * STEP, true)}
        <text x={C} y={C - 12} textAnchor="middle" className="fill-mist font-type" fontSize={13}>
          CHAVE
        </text>
        <text
          x={C}
          y={C + 20}
          textAnchor="middle"
          className="fill-brass font-heist"
          fontSize={hideKey ? 30 : 44}
        >
          {hideKey ? '🎧' : k}
        </text>
      </svg>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => turn(pos - 1)}
          aria-label="Girar o disco: chave menos 1"
          className="grid min-h-11 min-w-11 cursor-pointer place-items-center border-[3px] border-ink bg-paper font-heist text-2xl text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          ◀
        </button>
        <p className="font-type text-sm">
          {locked && !hideKey ? '🔒 disco travado' : 'fora: original · dentro: cifrado'}
        </p>
        <button
          type="button"
          disabled={locked}
          onClick={() => turn(pos + 1)}
          aria-label="Girar o disco: chave mais 1"
          className="grid min-h-11 min-w-11 cursor-pointer place-items-center border-[3px] border-ink bg-paper font-heist text-2xl text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

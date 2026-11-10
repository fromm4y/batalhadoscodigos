type Laser = { top: string; angle: number; delay?: number };

const DEFAULT: Laser[] = [
  { top: '22%', angle: 8 },
  { top: '64%', angle: -6, delay: 0.8 },
  { top: '86%', angle: 3, delay: 1.5 },
];

/** Lasers de segurança: linhas vermelhas finas que cruzam a tela e piscam. */
export function Lasers({ lasers = DEFAULT }: { lasers?: Laser[] }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {lasers.map((l, i) => (
        <div
          key={i}
          className="absolute -left-[10%] h-[2px] w-[120%] animate-laser bg-bando"
          style={{
            top: l.top,
            transform: `rotate(${l.angle}deg)`,
            animationDelay: `${l.delay ?? 0}s`,
            boxShadow: '0 0 8px 1px rgb(230 57 70 / 0.9), 0 0 22px 2px rgb(230 57 70 / 0.45)',
          }}
        />
      ))}
    </div>
  );
}

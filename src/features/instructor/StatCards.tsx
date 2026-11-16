import { cn } from '@/components/comic';

export type Stat = {
  icon: string;
  label: string;
  value: string | number;
  tone?: 'brass' | 'red' | 'blue' | 'green';
};

const TONE = {
  brass: 'text-brass text-glow-brass',
  red: 'text-bando text-glow-red',
  blue: 'text-piratas text-glow-blue',
  green: 'text-success',
} as const;

/** Faixa de números-resumo no topo dos painéis (pedido da May: "melhor de visualizar"). */
export function StatCards({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-3 md:grid-cols-4', className)}>
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-sm border-[3px] border-ink bg-graphite px-4 py-3 shadow-comic-sm"
        >
          <span className="text-3xl" aria-hidden>
            {s.icon}
          </span>
          <div className="min-w-0">
            <dt className="font-type text-xs leading-tight text-mist uppercase">{s.label}</dt>
            <dd
              className={cn(
                'truncate font-heist text-3xl leading-none tracking-wider',
                TONE[s.tone ?? 'brass'],
              )}
            >
              {s.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

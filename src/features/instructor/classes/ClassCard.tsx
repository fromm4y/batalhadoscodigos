import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { cn } from '@/components/comic';
import { Stamp } from '@/components/scene';
import type { ClassDoc } from '@/types/domain';
import type { WithId } from '../data';

const LEVEL_STYLE = {
  A: 'bg-success text-ink',
  B: 'bg-brass text-ink',
  C: 'bg-bando text-paper',
} as const;

type ClassCardProps = {
  cls: WithId<ClassDoc>;
  schoolName: string;
  /** Turma de outra instrutora (visão da admin): sem ações. */
  ownerLabel?: string;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  index?: number;
};

/** Turma como uma pasta de arquivo confidencial. */
export function ClassCard({
  cls,
  schoolName,
  ownerLabel,
  onEdit,
  onToggleArchive,
  index = 0,
}: ClassCardProps) {
  const readOnly = !onEdit;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: index * 0.05 }}
      className={cn('relative pt-5', cls.archived && 'opacity-60 saturate-50')}
      aria-label={`Turma ${cls.name}, ${schoolName}`}
    >
      <span className="absolute top-0 left-4 max-w-[70%] truncate rounded-t-md border-[3px] border-b-0 border-ink bg-[#a8834a] px-3 pt-0.5 font-type text-sm text-ink">
        {schoolName}
      </span>
      <div className="relative flex h-full flex-col gap-3 rounded-sm border-[3px] border-ink bg-aged p-4 text-ink shadow-comic">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-heist text-4xl leading-none tracking-wider">{cls.name}</h2>
          <span
            className={cn(
              'border-2 border-ink px-2 pt-0.5 font-heist text-xl tracking-wider',
              LEVEL_STYLE[cls.level],
            )}
            title={`Nível ${cls.level}`}
          >
            NÍVEL {cls.level}
          </span>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="font-type text-xs uppercase">Série</dt>
            <dd className="font-extrabold">{cls.grade}º ano</dd>
          </div>
          <div>
            <dt className="font-type text-xs uppercase">Turno</dt>
            <dd className="font-extrabold">{cls.shift === 'manha' ? '☀️ Manhã' : '🌇 Tarde'}</dd>
          </div>
          <div>
            <dt className="font-type text-xs uppercase">Temporada</dt>
            <dd className="font-extrabold">{cls.season}</dd>
          </div>
        </dl>
        {ownerLabel && <p className="font-type text-xs">Narradora: {ownerLabel}</p>}
        <div className="mt-auto flex flex-wrap gap-2">
          <Link
            to={`/instrutor/turmas/${cls.id}`}
            className="min-h-11 border-[3px] border-ink bg-ink px-3 pt-2 font-heist text-lg tracking-wider text-paper hover:bg-graphite"
          >
            Abrir ▸
          </Link>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="min-h-11 cursor-pointer border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider hover:bg-brass"
              >
                ✎ Editar
              </button>
              <button
                type="button"
                onClick={onToggleArchive}
                className="min-h-11 cursor-pointer border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider hover:bg-brass"
              >
                {cls.archived ? '↺ Reativar' : '🗄️ Arquivar'}
              </button>
            </>
          )}
        </div>
        {cls.archived && (
          <Stamp text="ARQUIVADA" className="absolute right-4 bottom-16 text-2xl" delay={0} />
        )}
      </div>
    </motion.article>
  );
}

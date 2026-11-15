import { useState } from 'react';
import { ComicButton, cn } from '@/components/comic';
import { postAsInstructor } from '@/lib/api';
import type { ClassDoc, TeamDoc } from '@/types/domain';
import { downloadText, rankingCsv } from './rankingCsv';

const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR');

/**
 * Encerrar temporada (SPEC-02 A4), em 3 passos: 1) exportar o ranking; 2) digitar o nome da turma;
 * 3) apagar duplas, pontos, PINs e sessões e arquivar a turma. Não tem volta.
 */
export function SeasonCloseDialog({
  classId,
  cls,
  schoolName,
  teams,
  onClose,
}: {
  classId: string;
  cls: ClassDoc;
  schoolName: string;
  teams: (TeamDoc & { id: string })[];
  onClose: (done: string | null) => void;
}) {
  const [exported, setExported] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameOk = same(name, cls.name);

  function exportCsv() {
    const csv = rankingCsv(teams, { school: schoolName, className: cls.name, season: cls.season });
    downloadText(`ranking-${cls.name.replace(/[^\p{L}\p{N}]+/gu, '-')}-${cls.season}.csv`, csv);
    setExported(true);
  }

  async function close() {
    setBusy(true);
    setError(null);
    const r = await postAsInstructor<{ teams: number; sessions: number }>('/api/season-close', {
      classId,
      confirmName: name,
    });
    setBusy(false);
    if (r.ok)
      onClose(
        `Temporada encerrada: ${r.teams} dupla(s) e ${r.sessions} sessão(ões) apagadas. A turma foi arquivada.`,
      );
    else setError(r.error);
  }

  const step = (n: number, done: boolean, title: string) => (
    <p className="flex items-center gap-2 font-heist text-2xl tracking-wider">
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink',
          done ? 'bg-success text-ink' : 'bg-paper text-ink',
        )}
      >
        {done ? '✔' : n}
      </span>
      {title}
    </p>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="season-close-title"
        className="flex w-full max-w-2xl flex-col gap-5 rounded-sm border-[3px] border-ink bg-aged p-6 text-ink shadow-comic"
      >
        <h2 id="season-close-title" className="font-heist text-4xl tracking-wider text-bando-dark">
          🏁 Encerrar a temporada de {cls.name}
        </h2>
        <p className="font-bold">
          Isto apaga <strong>todas as duplas, pontos, PINs e sessões</strong> da turma e arquiva a
          turma. <strong>Não tem volta.</strong> Faça na última aula do ano.
        </p>

        <section className="flex flex-col gap-2">
          {step(1, exported, 'Guardar o ranking')}
          <div className="flex flex-wrap items-center gap-2 pl-11">
            <ComicButton variant="brass" icon="⬇" onClick={exportCsv}>
              Baixar ranking final (CSV)
            </ComicButton>
            <span className="text-sm">
              Os certificados da temporada entram aqui quando ficarem prontos (SPEC-02 Parte E).
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          {step(2, nameOk, 'Confirmar o nome da turma')}
          <label className="grid gap-1 pl-11">
            <span className="text-sm">
              Digite <strong>{cls.name}</strong> para confirmar:
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!exported}
              className="min-h-11 border-[3px] border-ink bg-white px-3 font-bold disabled:opacity-50"
            />
          </label>
        </section>

        <section className="flex flex-col gap-2">
          {step(3, false, 'Apagar e arquivar')}
          <div className="flex flex-wrap gap-2 pl-11">
            <ComicButton
              variant="red"
              icon="🗑️"
              disabled={!exported || !nameOk || busy}
              onClick={() => void close()}
            >
              {busy ? 'Apagando...' : 'Encerrar temporada'}
            </ComicButton>
            <ComicButton variant="graphite" onClick={() => onClose(null)} disabled={busy}>
              Cancelar
            </ComicButton>
          </div>
        </section>
        {error && (
          <p role="alert" className="font-bold text-bando-dark">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

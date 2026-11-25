import { useState } from 'react';
import { ComicButton, ComicPanel } from '@/components/comic';
import { postAsInstructor } from '@/lib/api';
import type { TeamDoc } from '@/types/domain';
import { useAllClasses, useMyClasses, type WithId } from '../data';

const label = (t: WithId<TeamDoc>) => `${t.cityName} · ${t.pirateName} (${t.totalPoints} pts)`;
const select =
  'min-h-11 w-full border-[3px] border-ink bg-paper px-2 font-body text-base font-bold text-ink';

/**
 * Mesclar (pedido da May, 25/11): a dupla que criou uma ficha nova numa sessão separada volta
 * para a ficha original com tudo somado; e uma turma separada (ex.: "avançados") volta para esta.
 */
export function MergePanel({
  classId,
  className,
  teams,
  uid,
  isAdmin,
  onDone,
}: {
  classId: string;
  className: string;
  teams: WithId<TeamDoc>[];
  uid: string;
  isAdmin: boolean;
  onDone: (msg: { kind: 'ok' | 'error'; text: string }) => void;
}) {
  const mineClasses = useMyClasses(uid);
  const allClasses = useAllClasses(isAdmin);
  const others = (isAdmin ? allClasses.data : mineClasses.data).filter(
    (c) => c.id !== classId && !c.archived,
  );
  const sorted = [...teams].sort((a, b) => a.cityName.localeCompare(b.cityName, 'pt-BR'));

  const [keepId, setKeepId] = useState('');
  const [fromId, setFromId] = useState('');
  const [sure, setSure] = useState(false);
  const [fromClass, setFromClass] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const keep = teams.find((t) => t.id === keepId);
  const from = teams.find((t) => t.id === fromId);
  const otherClass = others.find((c) => c.id === fromClass);

  async function mergeTeams() {
    setBusy(true);
    const r = await postAsInstructor<{ totalPoints: number }>('/api/merge', {
      kind: 'teams',
      classId,
      keepId,
      fromId,
    });
    setBusy(false);
    setSure(false);
    if (r.ok) {
      setFromId('');
      onDone({
        kind: 'ok',
        text: `Fichas mescladas! ${keep?.cityName} agora tem ${r.totalPoints} pontos, com cartas, selos e progresso das duas.`,
      });
    } else onDone({ kind: 'error', text: r.error });
  }

  async function mergeClasses() {
    setBusy(true);
    const r = await postAsInstructor<{ teams: number; sessions: number }>('/api/merge', {
      kind: 'classes',
      keepClassId: classId,
      fromClassId: fromClass,
      confirmName: typed,
    });
    setBusy(false);
    setTyped('');
    if (r.ok) {
      setFromClass('');
      onDone({
        kind: 'ok',
        text: `Turma trazida: ${r.teams} dupla(s) e ${r.sessions} sessão(ões) agora estão em ${className}. Se alguma dupla ficou com duas fichas, mescle as fichas abaixo.`,
      });
    } else onDone({ kind: 'error', text: r.error });
  }

  return (
    <ComicPanel caption="🔀 Mesclar" tone="graphite" className="pt-8">
      <section className="flex flex-col gap-2" aria-label="Mesclar fichas da mesma dupla">
        <p className="font-heist text-xl tracking-wider text-paper">Fichas da mesma dupla</p>
        <p className="font-type text-sm text-mist">
          A dupla criou uma ficha nova? Junte na original: pontos, cartas (a dourada vale), selos,
          carimbos e o progresso das sessões vão juntos. Nome, personagem e PIN são os da ficha que
          fica. A repetida é apagada.
        </p>
        <label className="font-type text-sm text-paper">
          Ficha que FICA (a original)
          <select
            className={select}
            value={keepId}
            onChange={(e) => {
              setKeepId(e.target.value);
              setSure(false);
            }}
          >
            <option value="">Escolha...</option>
            {sorted.map((t) => (
              <option key={t.id} value={t.id}>
                {label(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="font-type text-sm text-paper">
          Ficha que SOME (a repetida)
          <select
            className={select}
            value={fromId}
            onChange={(e) => {
              setFromId(e.target.value);
              setSure(false);
            }}
          >
            <option value="">Escolha...</option>
            {sorted
              .filter((t) => t.id !== keepId)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {label(t)}
                </option>
              ))}
          </select>
        </label>
        {keep && from && (
          <p className="border-l-4 border-brass bg-brass/15 px-3 py-1 font-type text-sm text-paper">
            {from.cityName} → {keep.cityName}: cerca de {keep.totalPoints + from.totalPoints}{' '}
            pontos,{' '}
            {new Set([...(keep.cards ?? []), ...(from.cards ?? [])].map((c) => c.episodeId)).size}{' '}
            carta(s).
          </p>
        )}
        {sure ? (
          <div className="flex flex-wrap gap-2">
            <ComicButton variant="red" icon="🔀" disabled={busy} onClick={() => void mergeTeams()}>
              {busy ? 'Mesclando...' : 'Sim, mesclar'}
            </ComicButton>
            <ComicButton variant="graphite" onClick={() => setSure(false)}>
              Cancelar
            </ComicButton>
          </div>
        ) : (
          <ComicButton
            variant="paper"
            icon="🔀"
            disabled={!keep || !from}
            onClick={() => setSure(true)}
          >
            Mesclar fichas
          </ComicButton>
        )}
      </section>

      {others.length > 0 && (
        <section
          className="mt-5 flex flex-col gap-2 border-t-2 border-dashed border-graphite-light pt-4"
          aria-label="Trazer outra turma"
        >
          <p className="font-heist text-xl tracking-wider text-paper">Trazer outra turma</p>
          <p className="font-type text-sm text-mist">
            As duplas (com pontos e PIN) e as sessões da outra turma passam para {className}. A
            outra turma deixa de existir.
          </p>
          <select
            className={select}
            value={fromClass}
            onChange={(e) => setFromClass(e.target.value)}
            aria-label="Turma que vai ser trazida"
          >
            <option value="">Escolha a turma...</option>
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {otherClass && (
            <label className="font-type text-sm text-paper">
              Digite <strong>{otherClass.name}</strong> para confirmar:
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-1 min-h-11 w-full border-[3px] border-ink bg-paper px-2 font-body text-base font-bold text-ink"
              />
            </label>
          )}
          <ComicButton
            variant="red"
            icon="🏫"
            disabled={busy || !otherClass || typed.trim() !== otherClass.name}
            onClick={() => void mergeClasses()}
          >
            {busy ? 'Trazendo...' : `Trazer para ${className}`}
          </ComicButton>
        </section>
      )}
    </ComicPanel>
  );
}

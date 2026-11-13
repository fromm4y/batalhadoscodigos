import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import type { Episode } from '@/content/types';
import { eventDurationMs } from '@/engine/museumEvent';
import { useNow } from '@/lib/useNow';
import type { Level, SessionDoc, TeamDoc } from '@/types/domain';
import { useFeed, useHelpRequests, type WithId } from '../data';
import { markHelpDone, markMuseumEventDone, setFreeze, triggerMuseumEvent } from './sessionOps';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** Evento do museu (RN-32) e congelar telas (RN-46). O painel também faz o disparo automático. */
export function EventFreezePanel({
  sessionId,
  session,
  episode,
}: {
  sessionId: string;
  session: SessionDoc;
  episode: Episode | null;
}) {
  const now = useNow(1000);
  const [error, setError] = useState<string | null>(null);
  const ev = session.museumEvent;
  const autoAt = session.autoEventAt?.toMillis() ?? null;
  const startedAt = ev?.startedAt?.toMillis() ?? null;
  const frozen = session.freeze?.active === true;

  // Disparo automático (RN-32) e encerramento do evento. Pausa enquanto as telas estão congeladas.
  useEffect(() => {
    if (frozen || session.phase !== 'locks') return;
    if (ev?.status === 'idle' && autoAt && now >= autoAt)
      void triggerMuseumEvent(sessionId, 'auto');
    if (
      ev?.status === 'running' &&
      startedAt &&
      episode &&
      now > startedAt + eventDurationMs(episode.event) + 2000
    ) {
      void markMuseumEventDone(sessionId, session);
    }
  }, [now, frozen, session, sessionId, ev?.status, autoAt, startedAt, episode]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.error('[painel]', err);
      setError('Não consegui atualizar. Tente de novo.');
    }
  }

  const statusText =
    ev?.status === 'running'
      ? '🚨 Acontecendo agora!'
      : ev?.status === 'done'
        ? `✔ Já aconteceu (${ev.triggeredBy === 'auto' ? 'automático' : 'manual'})`
        : session.phase !== 'locks'
          ? 'Só acontece durante os cadeados.'
          : autoAt
            ? `Automático em ${fmt(autoAt - now)}`
            : 'Aguardando os cadeados.';

  return (
    <div className="flex flex-col gap-5">
      <ComicPanel
        caption="Evento do museu"
        tone={ev?.status === 'running' ? 'red' : 'graphite'}
        className="pt-8"
      >
        <p className="mb-3 font-heist text-2xl tracking-wider">{statusText}</p>
        <ComicButton
          variant="red"
          icon="🚨"
          disabled={ev?.status !== 'idle' || session.phase !== 'locks' || frozen}
          onClick={() => void run(() => triggerMuseumEvent(sessionId, 'instructor'))}
        >
          Disparar evento agora
        </ComicButton>
      </ComicPanel>

      <ComicPanel
        caption="Congelar telas"
        tone={frozen ? 'red' : 'graphite'}
        glow={frozen ? 'brass' : 'none'}
        className="pt-8"
      >
        <p className="mb-3 font-type text-sm text-mist">
          Cobre todas as telas com “TODOS OS OLHOS NA NARRADORA!”. O tempo congelado não conta.
        </p>
        {frozen ? (
          <ComicButton
            variant="brass"
            size="lg"
            icon="▶"
            onClick={() => void run(() => setFreeze(sessionId, session, false))}
          >
            Descongelar telas
          </ComicButton>
        ) : (
          <ComicButton
            variant="graphite"
            size="lg"
            icon="👀"
            onClick={() => void run(() => setFreeze(sessionId, session, true))}
          >
            Congelar telas
          </ComicButton>
        )}
      </ComicPanel>
      {error && (
        <p role="alert" className="font-bold text-alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Roteiro da Narradora (SPEC 9.3): caixa recolhível com as falas, inclusive as pistas faladas. */
export function ScriptPanel({ episode, level }: { episode: Episode | null; level: Level | null }) {
  const [open, setOpen] = useState(false);
  if (!episode) return null;
  const s = episode.narratorScript;
  return (
    <ComicPanel caption="Roteiro da Narradora" tone="paper" className="pt-8">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="min-h-11 cursor-pointer font-heist text-2xl tracking-wider text-ink underline underline-offset-4"
      >
        {open ? '▾ Esconder roteiro' : '▸ Mostrar roteiro'}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3 text-ink">
          <Block title="Abertura">{s.opening}</Block>
          {level && (
            <Block title={`Pistas faladas (nível ${level})`}>
              <ul className="list-disc pl-5">
                {s.spokenClues[level].map((c) => (
                  <li key={c.challengeKey}>
                    <strong>{c.challengeKey.startsWith('red') ? 'Bando' : 'Piratas'}:</strong> “
                    {c.say}”
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <Block title="Revelação">
            {s.revealLines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </Block>
          <Block title="Encerramento">{s.closing}</Block>
        </div>
      )}
    </ComicPanel>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-type text-sm uppercase">{title}</h3>
      <div className="font-body text-base font-semibold leading-relaxed">{children}</div>
    </section>
  );
}

/** Chamados de ajuda (RN-30): lista que pisca, com botão "Atendido". */
export function HelpPanel({ sessionId, teams }: { sessionId: string; teams: WithId<TeamDoc>[] }) {
  const help = useHelpRequests(sessionId);
  const open = help.data.filter((h) => h.status === 'open');
  if (open.length === 0) return null;
  const name = (id: string) => teams.find((t) => t.id === id)?.cityName ?? 'Dupla';
  return (
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 rgb(255 140 0 / 0)', '0 0 28px 6px rgb(255 140 0 / 0.7)'] }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
      className="rounded-hand"
    >
      <ComicPanel caption={`🙋 Chamados de ajuda · ${open.length}`} tone="paper" className="pt-8">
        <ul className="grid gap-2" aria-live="assertive">
          {open.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 text-ink">
              <span className="font-bold">
                {name(h.teamId)} <span className="font-type text-sm">({h.challengeKey})</span>
              </span>
              <ComicButton
                variant="success"
                icon="✔"
                onClick={() => void markHelpDone(sessionId, h.id)}
              >
                Atendido
              </ComicButton>
            </li>
          ))}
        </ul>
      </ComicPanel>
    </motion.div>
  );
}

/** Linha do tempo (SPEC 9.3): "Recife abriu o Cadeado 2", "Âncora Dourada usou Escudo". */
export function FeedPanel({ sessionId }: { sessionId: string }) {
  const feed = useFeed(sessionId);
  if (feed.data.length === 0) return null;
  return (
    <ComicPanel caption="Linha do tempo" tone="graphite" className="pt-8">
      <ol className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-2" aria-live="polite">
        {feed.data.map((f) => (
          <li
            key={f.id}
            className={cn('font-type text-sm', f.type === 'jail' ? 'text-alert' : 'text-paper')}
          >
            <span className="text-mist">
              {f.at
                ? f.at.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '··:··'}
            </span>{' '}
            {f.payload.text}
          </li>
        ))}
      </ol>
    </ComicPanel>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ComicButton, cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';
import { loadAnyEpisode } from '@/content/episodes';
import { SEASON } from '@/content/season';
import type { AnyEpisode, Challenge } from '@/content/types';
import { answerKey } from '@/engine/answerKey';
import type { Level } from '@/types/domain';

const LEVELS: Level[] = ['A', 'B', 'C'];
const LEVEL_LABEL: Record<Level, string> = { A: 'A (4º e 5º)', B: 'B (6º e 7º)', C: 'C (8º e 9º)' };

/**
 * `/instrutor/roteiro/:episodeId` — roteiro completo da Narradora numa aba própria (pedido da
 * May, 15/11). Muda com o episódio; dá para imprimir. Só na área da instrutora.
 */
export function ScriptPage() {
  const { episodeId = 'ep1' } = useParams();
  const navigate = useNavigate();
  const [ep, setEp] = useState<{ id: string; data: AnyEpisode | null } | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadAnyEpisode(episodeId).then((data) => alive && setEp({ id: episodeId, data }));
    return () => {
      alive = false;
    };
  }, [episodeId]);

  const e = ep?.id === episodeId ? ep.data : null;
  const g = GAME_RULES.phaseGuideMinutes;
  const coop = e?.mode === 'coop';
  const titleOf = (key: string) => {
    if (!e) return key;
    const all: Challenge[] =
      e.mode === 'coop'
        ? [...e.coop.locks, e.coop.vault]
        : [...e.sides.red.locks, e.sides.red.vault, ...e.sides.blue.locks, e.sides.blue.vault];
    return all.find((c) => c.key === key)?.title ?? key;
  };
  const sideOf = (key: string) =>
    key.startsWith('red') ? '🎭 Bando' : key.startsWith('blue') ? '⚓ Piratas' : '🤝 Aliança';

  return (
    <div className="min-h-screen bg-night text-paper print:bg-white print:text-black">
      <header className="sticky top-0 z-10 border-b-4 border-ink bg-graphite px-4 py-3 print:static print:bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <h1 className="font-heist text-3xl tracking-wider text-brass">📜 Roteiro da Narradora</h1>
          <div className="flex flex-wrap gap-2 print:hidden">
            <ComicButton variant="paper" icon="🖨️" onClick={() => window.print()}>
              Imprimir
            </ComicButton>
            <Link
              to="/instrutor/turmas"
              className="grid min-h-11 place-items-center border-[3px] border-ink bg-graphite-light px-3 pt-1 font-heist text-lg tracking-wider"
            >
              Turmas
            </Link>
          </div>
        </div>
        <nav
          aria-label="Episódios"
          className="mx-auto mt-3 flex max-w-5xl flex-wrap gap-2 print:hidden"
        >
          {SEASON.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={s.id === episodeId ? 'page' : undefined}
              onClick={() => navigate(`/instrutor/roteiro/${s.id}`)}
              className={cn(
                'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
                s.id === episodeId ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
              )}
            >
              Ep. {s.number} · {s.title}
              {!s.available && <span className="ml-1 text-xs">(em breve)</span>}
            </button>
          ))}
        </nav>
      </header>

      {!e ? (
        <p className="p-8 text-center font-type text-mist">Carregando o roteiro...</p>
      ) : (
        <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 font-body text-lg leading-relaxed">
          <section className="rounded-sm border-[3px] border-ink bg-aged p-5 text-ink">
            <h2 className="font-heist text-4xl tracking-wider">
              Ep. {e.number} — {e.title}
            </h2>
            <p className="font-type">
              {e.invention.name} · {e.invention.year} · {e.invention.people.join(', ')}
            </p>
          </section>

          <Block title="⏱️ Linha do tempo da aula">
            <ol className="grid gap-3">
              <Step min={`0–${GAME_RULES.lesson.entryMinutes}`} title="Entrada">
                <p>Código no projetor; as duplas entram (Começar → código → dupla → PIN).</p>
              </Step>
              <Step min={`${g.planning} min`} title="Planejamento — leia em voz alta">
                <Quote>{e.narratorScript.opening}</Quote>
                <p>
                  {coop
                    ? 'Hoje não tem lados: a turma inteira é a Aliança contra a máquina.'
                    : 'Quando todos escolherem o lado, clique em Formar confrontos.'}
                </p>
              </Step>
              <Step min={`${g.locks} min`} title="Cadeados">
                <p>
                  Quando o painel mostrar <strong>“N duplas aguardando a pista falada”</strong>,
                  clique em <strong>Iniciar transmissão</strong>, leia a pista do nível da turma
                  (tabela abaixo) e clique em <strong>Encerrar</strong>. Dupla que chegar depois:
                  transmita de novo. O alarme do museu dispara sozinho entre{' '}
                  {GAME_RULES.museumEvent.autoTriggerMinMinutes} e{' '}
                  {GAME_RULES.museumEvent.autoTriggerMaxMinutes} min.
                </p>
              </Step>
              <Step min={`${g.vault} min`} title="Cofre">
                <p>Libere o Cofre. Quem estava na frente na barra ganha a Dica 1 grátis.</p>
              </Step>
              <Step min={`até ${g.end} min`} title="Fim — leia a revelação">
                {e.narratorScript.revealLines.map((l) => (
                  <Quote key={l}>{l}</Quote>
                ))}
                <Quote>{e.narratorScript.closing}</Quote>
                <p>
                  No projetor: <strong>🏆 Ranking</strong> e depois <strong>📡 Gancho</strong>.
                </p>
              </Step>
            </ol>
          </Block>

          <Block title="🎧 Pistas faladas (transmissão)">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-ink/40">
                  <th className="py-1 pr-3">Nível</th>
                  <th className="py-1 pr-3">Lado · desafio</th>
                  <th className="py-1">O que falar</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.flatMap((lv) =>
                  e.narratorScript.spokenClues[lv].map((c) => (
                    <tr key={lv + c.challengeKey} className="border-b border-ink/15 align-top">
                      <td className="py-2 pr-3 font-bold whitespace-nowrap">{LEVEL_LABEL[lv]}</td>
                      <td className="py-2 pr-3">
                        {sideOf(c.challengeKey)} · {titleOf(c.challengeKey)}
                      </td>
                      <td className="py-2 font-bold">“{c.say}”</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </Block>

          <Block title={`🚨 Evento do museu: ${e.event.title}`}>
            <ol className="grid gap-2">
              {e.event.items.map((it, i) => (
                <li key={i}>
                  <strong>{it.isReal ? '✅ REAL' : '❌ FALSO'}</strong> — {it.text}
                  <br />
                  <span className="text-base">{it.explanation}</span>
                </li>
              ))}
            </ol>
          </Block>

          <Block title="💡 Curiosidades (para a prisão e para puxar conversa)">
            <ul className="list-disc pl-6">
              {e.curiosities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Block>

          <Block title="🔑 Gabarito (para ajudar quem travou)">
            <button
              type="button"
              aria-expanded={showKey}
              onClick={() => setShowKey((s) => !s)}
              className="mb-3 min-h-11 cursor-pointer border-[3px] border-ink bg-paper px-3 pt-1 font-heist text-lg tracking-wider print:hidden"
            >
              {showKey ? '🙈 Esconder gabarito' : '👀 Mostrar gabarito'}
            </button>
            {showKey && <AnswerTable e={e} />}
          </Block>
        </main>
      )}
    </div>
  );
}

function AnswerTable({ e }: { e: AnyEpisode }) {
  const groups: { label: string; list: Challenge[] }[] =
    e.mode === 'coop'
      ? [{ label: '🤝 Aliança', list: [...e.coop.locks, e.coop.vault] }]
      : [
          { label: '🎭 Bando', list: [...e.sides.red.locks, e.sides.red.vault] },
          { label: '⚓ Piratas', list: [...e.sides.blue.locks, e.sides.blue.vault] },
        ];
  return (
    <div className="grid gap-4">
      {groups.map((g) => (
        <div key={g.label} className="overflow-x-auto">
          <h3 className="font-heist text-2xl tracking-wider">{g.label}</h3>
          <table className="w-full min-w-[36rem] border-collapse text-left text-base">
            <thead>
              <tr className="border-b-2 border-ink/40">
                <th className="py-1 pr-3">Desafio</th>
                {LEVELS.map((lv) => (
                  <th key={lv} className="py-1 pr-3">
                    Nível {lv}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.list.map((c, i) => (
                <tr key={c.key} className="border-b border-ink/15 align-top">
                  <td className="py-2 pr-3 font-bold">
                    {i < 3 ? `${i + 1}.` : 'Cofre ·'} {c.title}
                  </td>
                  {LEVELS.map((lv) => (
                    <td key={lv} className="py-2 pr-3">
                      {answerKey(c, lv)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border-[3px] border-ink bg-aged p-5 text-ink shadow-comic print:shadow-none">
      <h2 className="mb-3 font-heist text-3xl tracking-wider">{title}</h2>
      {children}
    </section>
  );
}

function Step({ min, title, children }: { min: string; title: string; children: React.ReactNode }) {
  return (
    <li className="grid gap-1 border-l-4 border-brass pl-3">
      <p className="font-heist text-2xl tracking-wider">
        <span className="mr-2 text-bando-dark">{min}</span>
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </li>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-ink/30 bg-paper/60 px-3 py-2 font-type italic">
      “{children}”
    </blockquote>
  );
}

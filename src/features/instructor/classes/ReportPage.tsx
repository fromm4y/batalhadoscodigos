import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { loadEpisode } from '@/content/episodes';
import type { Challenge, Episode, SideContent } from '@/content/types';
import { SEASON } from '@/content/season';
import {
  attemptsCsv,
  episodeReport,
  type Attempt,
  type EpisodeReport,
  type MatchLite,
  type PlayerLite,
} from '@/engine/report';
import { getFirebase } from '@/lib/firebase';
import { useProfile } from '../auth/authStore';
import { useClass, useClassTeams } from '../data';
import { InstructorLayout } from '../InstructorLayout';

type EpData = { report: EpisodeReport; attempts: Attempt[]; live: boolean };

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Nome legível de cada desafio do episódio (key → "Cadeado 2 · etapa 2 · Bando: título"). */
function challengeNames(ep: Episode | null): Record<string, string> {
  if (!ep) return {};
  const out: Record<string, string> = {};
  const sides: [string, SideContent][] = ep.alliance
    ? [['Aliança', ep.sides.red]]
    : [
        ['Bando', ep.sides.red],
        ['Piratas', ep.sides.blue],
      ];
  for (const [who, sd] of sides) {
    const slots: [string, Challenge | undefined][] = [
      ...sd.locks.map((c, i) => [`Cadeado ${i + 1}`, c] as [string, Challenge]),
      ['Cofre', sd.vault],
      ['Missão bônus', sd.bonus],
    ];
    for (const [slot, c] of slots) {
      if (!c) continue;
      out[c.key] = `${slot} · ${who}: ${c.title}`;
      if (c.stage2) out[c.stage2.key] = `${slot} (etapa 2) · ${who}: ${c.stage2.title}`;
    }
  }
  return out;
}

/**
 * `/instrutor/turmas/:classId/relatorio` — relatório da turma (SPEC-02 F2): por episódio e pela
 * temporada. Calcula a partir das sessões que ainda existem e guarda o resumo (só números) em
 * `classes/{classId}/reports/{episodeId}`, que sobrevive à limpeza. CSV anonimizado por padrão.
 */
export function ReportPage() {
  const { classId = '' } = useParams();
  const profile = useProfile()!;
  const cls = useClass(classId);
  const teams = useClassTeams(classId);
  const [data, setData] = useState<Record<string, EpData> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [epId, setEpId] = useState<string | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [anonymize, setAnonymize] = useState(true);
  const owner = cls.data?.instructorId ?? null;
  const mine = owner === profile.uid;

  useEffect(() => {
    if (!owner) return;
    const { db } = getFirebase();
    void (async () => {
      try {
        const sessions = await getDocs(
          query(
            collection(db, 'sessions'),
            where('classId', '==', classId),
            where('instructorId', '==', owner),
          ),
        );
        const byEp = new Map<
          string,
          { s: number; a: Attempt[]; p: PlayerLite[]; m: MatchLite[]; h: Record<string, number> }
        >();
        for (const s of sessions.docs) {
          const ep = String(s.data().episodeId);
          if (!s.data().phase || s.data().phase === 'lobby') continue;
          const [a, p, m, h] = await Promise.all(
            ['attempts', 'players', 'matches', 'helpRequests'].map((c) =>
              getDocs(collection(db, 'sessions', s.id, c)),
            ),
          );
          const cur = byEp.get(ep) ?? { s: 0, a: [], p: [], m: [], h: {} };
          cur.s++;
          cur.a.push(...a!.docs.map((d) => d.data() as Attempt));
          cur.p.push(...p!.docs.map((d) => d.data() as PlayerLite));
          cur.m.push(...m!.docs.map((d) => d.data() as MatchLite));
          for (const d of h!.docs) {
            const k = String(d.data().challengeKey ?? '');
            if (k) cur.h[k] = (cur.h[k] ?? 0) + 1;
          }
          byEp.set(ep, cur);
        }
        const out: Record<string, EpData> = {};
        for (const [ep, v] of byEp) {
          const report = episodeReport({
            episodeId: ep,
            sessions: v.s,
            attempts: v.a,
            players: v.p,
            matches: v.m,
            helpByKey: v.h,
          });
          out[ep] = { report, attempts: v.a, live: true };
          // guarda o resumo (só números) para sobreviver à limpeza
          if (mine)
            void setDoc(doc(db, 'classes', classId, 'reports', ep), {
              ...report,
              updatedAt: serverTimestamp(),
            }).catch(() => undefined);
        }
        // episódios cujas sessões já foram limpas: o resumo guardado
        const saved = await getDocs(collection(db, 'classes', classId, 'reports'));
        for (const d of saved.docs)
          if (!out[d.id])
            out[d.id] = { report: d.data() as EpisodeReport, attempts: [], live: false };
        setData(out);
        const order = SEASON.map((e) => e.id).filter((id) => out[id]);
        setEpId((cur) => cur ?? order.at(-1) ?? null);
      } catch (err) {
        console.error('[relatório]', err);
        setError('Não consegui montar o relatório. Tente de novo em instantes.');
      }
    })();
  }, [classId, owner, mine]);

  useEffect(() => {
    if (epId) void loadEpisode(epId).then(setEpisode);
  }, [epId]);

  const eps = SEASON.filter((e) => data?.[e.id]);
  const cur = epId ? data?.[epId] : undefined;
  const names = challengeNames(episode?.id === epId ? episode : null);
  // ordem do jogo: cadeado 1, etapa 2, cadeado 2... (desafio desconhecido vai para o fim)
  const keyOrder = Object.keys(names);
  const order = (k: string) => (keyOrder.includes(k) ? keyOrder.indexOf(k) : 999);
  const alliance = episode?.id === epId && episode?.alliance === true;
  const teamNames = Object.fromEntries(teams.data.map((t) => [t.id, t.cityName]));

  function downloadCsv() {
    if (!cur) return;
    const blob = new Blob(['﻿' + attemptsCsv(cur.attempts, teamNames, anonymize)], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${cls.data?.name ?? 'turma'}-${epId}.csv`.replace(/\s+/g, '-');
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <InstructorLayout title={`📊 Relatório · ${cls.data?.name ?? ''}`}>
      <Link
        to={`/instrutor/turmas/${classId}`}
        className="-mt-4 mb-4 inline-block font-bold text-brass underline"
      >
        ← Voltar para a turma
      </Link>
      {error && (
        <p role="alert" className="mb-4 font-bold text-alert">
          {error}
        </p>
      )}
      {!data ? (
        <p className="font-type text-mist">Somando as tentativas da turma...</p>
      ) : eps.length === 0 ? (
        <p className="font-type text-xl text-mist">
          Ainda não há aulas jogadas nesta turma. O relatório aparece depois da primeira aula.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <ComicPanel caption="A temporada" tone="graphite" className="pt-8">
            <p className="mb-3 font-type text-sm text-mist">
              Acerto de primeira (barra) e quantas duplas jogaram, por episódio.
            </p>
            <ul className="flex flex-col gap-2" aria-label="Acerto de primeira por episódio">
              {eps.map((e) => {
                const r = data[e.id]!.report;
                return (
                  <li key={e.id} className="grid grid-cols-[9rem_1fr_7rem] items-center gap-3">
                    <span className="font-heist text-lg tracking-wider text-paper">
                      Ep. {e.number} · {e.title}
                    </span>
                    <span className="h-5 overflow-hidden rounded-sm border-2 border-ink bg-night">
                      <span
                        className="block h-full bg-success"
                        style={{ width: pct(r.firstTryRate) }}
                      />
                    </span>
                    <span className="font-type text-sm text-paper">
                      {pct(r.firstTryRate)} · {r.teams} dupla(s)
                    </span>
                  </li>
                );
              })}
            </ul>
          </ComicPanel>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Episódio">
            {eps.map((e) => (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={epId === e.id}
                onClick={() => setEpId(e.id)}
                className={cn(
                  'min-h-11 cursor-pointer border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
                  epId === e.id ? 'bg-brass text-ink' : 'bg-graphite-light text-paper',
                )}
              >
                Ep. {e.number}
              </button>
            ))}
          </div>

          {cur && (
            <ComicPanel
              caption={`Ep. ${SEASON.find((e) => e.id === epId)?.number} · ${cur.report.sessions} aula(s)`}
              tone="graphite"
              className="pt-8"
            >
              <div className="mb-4 flex flex-wrap gap-2 font-type text-sm text-paper">
                <Chip>👥 {cur.report.teams} duplas</Chip>
                <Chip>✍️ {cur.report.attempts} respostas</Chip>
                <Chip>🎯 {pct(cur.report.firstTryRate)} de primeira</Chip>
                <Chip>
                  {alliance
                    ? `🤝 ${cur.report.sides.red ?? 0} na Aliança`
                    : `🎭 ${cur.report.sides.red ?? 0} · ⚓ ${cur.report.sides.blue ?? 0}`}
                </Chip>
                <Chip>
                  🏆 Bando {cur.report.wins.red} · Piratas {cur.report.wins.blue} · Robô{' '}
                  {cur.report.wins.machine}
                  {cur.report.wins.class ? ` · Aliança ${cur.report.wins.class}` : ''}
                </Chip>
                <Chip>
                  🚨 Alarme: {cur.report.event.ok} certo(s), {cur.report.event.failed} errado(s)
                </Chip>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse font-type text-sm text-paper">
                  <thead>
                    <tr className="border-b-2 border-brass text-left">
                      <th className="py-1 pr-2">Desafio</th>
                      <th className="px-2">De primeira</th>
                      <th className="px-2">Tentativas</th>
                      <th className="px-2">Dica 1</th>
                      <th className="px-2">Dica 2</th>
                      <th className="px-2">Tempo médio</th>
                      <th className="px-2">Ajuda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...cur.report.challenges]
                      .sort((a, b) => order(a.challengeKey) - order(b.challengeKey))
                      .map((c) => (
                        <tr key={c.challengeKey} className="border-b border-graphite-light">
                          <td className="py-1.5 pr-2">{names[c.challengeKey] ?? c.challengeKey}</td>
                          <td className="px-2">
                            <span className="flex items-center gap-2">
                              <span className="h-3 w-20 overflow-hidden rounded-sm bg-night">
                                <span
                                  className="block h-full bg-success"
                                  style={{ width: pct(c.firstTryRate) }}
                                />
                              </span>
                              {c.firstTry}/{c.teams}
                            </span>
                          </td>
                          <td className="px-2">{c.avgAttempts}</td>
                          <td className="px-2">{c.hint1}</td>
                          <td className="px-2">{c.hint2}</td>
                          <td className="px-2">
                            {c.avgSeconds >= 60
                              ? `${Math.floor(c.avgSeconds / 60)} min ${c.avgSeconds % 60} s`
                              : `${c.avgSeconds} s`}
                          </td>
                          <td className="px-2">{c.help || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {cur.live ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <label className="flex min-h-11 items-center gap-2 font-type text-paper">
                    <input
                      type="checkbox"
                      checked={anonymize}
                      onChange={(e) => setAnonymize(e.target.checked)}
                      className="h-5 w-5"
                    />
                    Anonimizar (Dupla 01, Dupla 02...)
                  </label>
                  <ComicButton variant="brass" icon="⬇️" onClick={downloadCsv}>
                    Baixar CSV das respostas
                  </ComicButton>
                </div>
              ) : (
                <p className="mt-3 font-type text-sm text-mist">
                  As sessões deste episódio já foram limpas: aqui fica o resumo guardado (sem as
                  respostas uma a uma).
                </p>
              )}
            </ComicPanel>
          )}

          <p className="border-l-4 border-brass bg-brass/10 px-3 py-2 font-type text-sm text-paper">
            🔬 Os números são agregados e sem identificação dos alunos, ótimos para acompanhar a
            turma. Para usar em <strong>pesquisa acadêmica</strong>, siga as regras da sua
            instituição (em geral, comitê de ética e termos de consentimento/assentimento). O
            sistema não substitui isso.
          </p>
        </div>
      )}
    </InstructorLayout>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border-2 border-brass/60 bg-night px-3 py-1">{children}</span>
  );
}

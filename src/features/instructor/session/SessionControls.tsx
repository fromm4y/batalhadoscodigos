import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ComicButton, ComicPanel, cn } from '@/components/comic';
import { GAME_RULES } from '@/config/gameRules';
import { loadEpisode } from '@/content/episodes';
import type { Episode } from '@/content/types';
import { resolveChallenge } from '@/engine/challenges';
import { currentStage, needsTransmission, spokenClueFor } from '@/engine/progress';
import { getFirebase } from '@/lib/firebase';
import { useNow } from '@/lib/useNow';
import type { Level, Phase, PlayerDoc, SessionDoc } from '@/types/domain';
import { useProfile } from '../auth/authStore';
import type { WithId } from '../data';
import { formSessionMatches, markVaultLeaders, resolveOpenMatches } from './matchOps';

const ORDER: Phase[] = ['lobby', 'planning', 'locks', 'vault', 'end'];
const LABEL: Record<Phase, string> = {
  lobby: 'Lobby',
  planning: 'Planejamento',
  locks: 'Cadeados',
  vault: 'Cofre',
  end: 'Fim',
};

type Props = {
  sessionId: string;
  session: SessionDoc;
  level: Level | null;
  players: WithId<PlayerDoc>[];
};

/**
 * Controles mínimos da Etapa 3: liberar a próxima fase (RN-05: nada avança sozinho)
 * e transmissão da Narradora (RN-45). O painel completo chega na Etapa 5.
 */
export function SessionControls({ sessionId, session, level, players }: Props) {
  const profile = useProfile()!;
  const opsCtx = { sessionId, session, uid: profile.uid };
  const [info, setInfo] = useState<string | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(1000);

  useEffect(() => {
    void loadEpisode(session.episodeId).then(setEpisode);
  }, [session.episodeId]);

  const idx = ORDER.indexOf(session.phase);
  const next = ORDER[idx + 1] ?? null;
  const elapsed = Math.max(
    0,
    Math.floor((now - (session.phaseStartedAt?.toMillis?.() ?? now)) / 1000),
  );
  const guide = GAME_RULES.phaseGuideMinutes[session.phase];
  const ref = doc(getFirebase().db, 'sessions', sessionId);

  // Duplas paradas no passo que depende da pista falada.
  const waiting =
    episode && level
      ? players.filter((p) => {
          if (!p.side || p.progress.heardTransmission) return false;
          const st = currentStage(session.phase, p.progress);
          return (
            st.kind === 'challenge' &&
            needsTransmission(resolveChallenge(episode, p.side, level, st.slot))
          );
        }).length
      : 0;
  const clues = episode && level ? episode.narratorScript.spokenClues[level] : [];

  async function run(fn: () => Promise<void>) {
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.error('[painel]', err);
      setError('Não consegui atualizar a sessão. Tente de novo.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ComicPanel caption="Fases" tone="graphite" className="pt-8">
        <ol className="mb-4 flex gap-1" aria-label="Fases da sessão">
          {ORDER.map((ph, i) => (
            <li
              key={ph}
              aria-current={ph === session.phase ? 'step' : undefined}
              className={cn(
                'flex-1 border-2 border-ink px-1 pt-1 text-center font-heist text-lg tracking-wide',
                i < idx
                  ? 'bg-success/70 text-ink'
                  : i === idx
                    ? 'bg-brass text-ink glow-brass'
                    : 'bg-graphite-light text-mist',
              )}
            >
              {LABEL[ph]}
            </li>
          ))}
        </ol>
        <p className="mb-3 font-type text-mist">
          ⏱ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
          {String(elapsed % 60).padStart(2, '0')}
          {guide > 0 && ` · tempo guia ${guide} min`} · nada avança sozinho
        </p>
        {next &&
          (confirm ? (
            <div className="flex gap-2">
              <ComicButton
                variant="red"
                icon="✔"
                onClick={() =>
                  void run(async () => {
                    // RN-18: vantagem do Cofre antes de liberar; RN-20: resultado antes do fim.
                    if (next === 'vault') await markVaultLeaders(opsCtx);
                    if (next === 'end') await resolveOpenMatches(opsCtx);
                    await updateDoc(ref, { phase: next, phaseStartedAt: serverTimestamp() });
                    setConfirm(false);
                  })
                }
              >
                Confirmar: {LABEL[next]}
              </ComicButton>
              <ComicButton variant="graphite" onClick={() => setConfirm(false)}>
                Cancelar
              </ComicButton>
            </div>
          ) : (
            <ComicButton variant="brass" size="lg" icon="▶" onClick={() => setConfirm(true)}>
              Liberar próxima fase: {LABEL[next]}
            </ComicButton>
          ))}
        {(session.phase === 'planning' || session.phase === 'locks') && (
          <div className="mt-4 border-t-2 border-dashed border-graphite-light pt-3">
            <p className="mb-2 font-type text-sm text-mist">
              {players.filter((p) => p.side).length}/{players.length} duplas escolheram lado ·{' '}
              {players.filter((p) => p.matchId).length} já em confronto
            </p>
            <ComicButton
              variant={session.matchesFormed ? 'graphite' : 'red'}
              icon="⚔️"
              onClick={() =>
                void run(async () => {
                  const r = await formSessionMatches(opsCtx);
                  setInfo(
                    r.matches
                      ? `${r.matches} confronto(s) formado(s)${r.bonus ? `, ${r.bonus} dupla(s) com bônus de lado vazio` : ''}.`
                      : 'Todas as duplas já estão em confronto.',
                  );
                })
              }
            >
              {session.matchesFormed ? 'Formar confrontos (novas duplas)' : 'Formar confrontos'}
            </ComicButton>
            {info && (
              <p role="status" className="mt-2 font-bold text-success">
                {info}
              </p>
            )}
          </div>
        )}
      </ComicPanel>

      <ComicPanel
        caption="Transmissão da Narradora"
        tone={session.transmission?.active ? 'red' : 'graphite'}
        glow={session.transmission?.active ? 'red' : 'none'}
        className="pt-8"
      >
        <p className="mb-2 font-heist text-2xl tracking-wider">
          🎧 {waiting} dupla(s) aguardando a pista falada
        </p>
        {clues.length > 0 && (
          <ul className="mb-3 space-y-1 rounded-md bg-night/50 p-2 text-sm">
            {clues.map((c) => (
              <li key={c.challengeKey}>
                <span className="font-type text-mist">
                  {c.challengeKey.startsWith('red') ? 'Bando' : 'Piratas'}:
                </span>{' '}
                <strong>“{spokenClueFor(episode!.narratorScript, level!, c.challengeKey)}”</strong>
              </li>
            ))}
          </ul>
        )}
        {session.transmission?.active ? (
          <ComicButton
            variant="paper"
            icon="⏹"
            onClick={() =>
              void run(() =>
                updateDoc(ref, {
                  transmission: { active: false, id: session.transmission.id, startedAt: null },
                }),
              )
            }
          >
            Encerrar transmissão
          </ComicButton>
        ) : (
          <ComicButton
            variant="red"
            icon="📡"
            disabled={session.phase !== 'locks' && session.phase !== 'vault'}
            onClick={() =>
              void run(() =>
                updateDoc(ref, {
                  transmission: {
                    active: true,
                    id: `t${Date.now()}`,
                    startedAt: serverTimestamp(),
                  },
                }),
              )
            }
          >
            Iniciar transmissão
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

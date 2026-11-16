import { useEffect } from 'react';
import { ComicButton, cn } from '@/components/comic';
import { Typewriter } from '@/components/scene';
import { GAME_RULES } from '@/config/gameRules';
import type { PreviousSummary } from '@/types/domain';

/**
 * "Anteriormente na Caçada..." (SPEC-02 C1): abertura estilo série, com o resumo do episódio
 * anterior e os números REAIS da aula passada da turma. No aluno dura no máximo
 * `previouslySeconds` e tem "Pular"; no projetor a Narradora troca quando quiser.
 */
export function PreviouslyPanel({
  recap,
  title,
  stats,
  big = false,
  onDone,
}: {
  recap: string[];
  /** título do episódio anterior */
  title: string;
  /** null quando a aula anterior foi apagada pela limpeza: só o resumo */
  stats: PreviousSummary | null;
  big?: boolean;
  onDone?: () => void;
}) {
  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, GAME_RULES.ui.previouslySeconds * 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  const w = stats?.wins;
  const tile = cn(
    'flex flex-col items-center rounded-md border-[3px] border-ink bg-graphite px-3 py-2 text-center',
    big ? 'min-w-48' : 'min-w-32',
  );
  return (
    <section
      aria-label="Anteriormente na Caçada"
      className="flex w-full flex-col items-center gap-5 rounded-hand border-4 border-ink bg-noir p-5 sm:p-8"
    >
      <p className="font-type text-sm tracking-widest text-mist uppercase">📼 {title}</p>
      <h1
        className={cn(
          'text-center font-heist tracking-[0.15em] text-paper text-glow-spot',
          big ? 'text-7xl' : 'text-5xl',
        )}
      >
        ANTERIORMENTE NA CAÇADA...
      </h1>
      <div className={cn('flex max-w-3xl flex-col gap-2', big ? 'text-3xl' : 'text-xl')}>
        {recap.map((line, i) => (
          <Typewriter key={line} text={line} speed={35} delay={i * 1800} className="text-paper" />
        ))}
      </div>
      {stats && w && (
        <ul
          className={cn(
            'flex flex-wrap justify-center gap-3 font-heist tracking-wider',
            big ? 'text-4xl' : 'text-2xl',
          )}
          aria-label="Números da aula passada"
        >
          <li className={tile}>
            <span className="text-bando text-glow-red">🎭 {w.red}</span>
            <span className="font-type text-xs text-mist">vitórias do Bando</span>
          </li>
          <li className={tile}>
            <span className="text-piratas text-glow-blue">⚓ {w.blue}</span>
            <span className="font-type text-xs text-mist">vitórias dos Piratas</span>
          </li>
          {w.machine > 0 && (
            <li className={tile}>
              <span className="text-paper">🤖 {w.machine}</span>
              <span className="font-type text-xs text-mist">vitórias do Robô</span>
            </li>
          )}
          <li className={tile}>
            <span className="text-brass">
              🔐 {stats.vaultOpened}/{stats.teams}
            </span>
            <span className="font-type text-xs text-mist">duplas abriram o Cofre</span>
          </li>
          {stats.highlight && (
            <li className={tile}>
              <span className={stats.highlight.side === 'red' ? 'text-bando' : 'text-piratas'}>
                ⭐ {stats.highlight.name}
              </span>
              <span className="font-type text-xs text-mist">
                destaque da aula (+{stats.highlight.points})
              </span>
            </li>
          )}
        </ul>
      )}
      {onDone && (
        <ComicButton variant="brass" icon="⏭" onClick={onDone}>
          Pular
        </ComicButton>
      )}
    </section>
  );
}

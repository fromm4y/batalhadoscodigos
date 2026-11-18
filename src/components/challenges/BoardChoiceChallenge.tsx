import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/components/comic';
import type { BoardChoiceVariant } from '@/content/types';
import { LINES, placeMove, threats } from '@/engine/boardGames';
import { checkBoardChoice } from '@/engine/challenges';
import type { Level } from '@/types/domain';
import { SubmitButton, WaitingTransmission, type ChallengeBaseProps } from './common';

/** Nome da casa como a Narradora fala (1 = canto de cima à esquerda). */
const cellName = (i: number) => `casa ${i + 1}`;

/**
 * boardChoice (Ep. 5, SPEC-03 §4.2): jogo da velha neon. A jogada da máquina vem pela
 * transmissão: a dupla clica onde a máquina jogou (para mostrar que escutou) e o O aparece;
 * só então escolhe a jogada do X. Na etapa 2 (`revealed`), o O já aparece piscando.
 * Apoio ao vivo (A e B): no A a linha em perigo acende; no B aparece o aviso de ameaça.
 */
export function BoardChoiceChallenge({
  variant,
  heard,
  level,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & { variant: BoardChoiceVariant; heard: boolean; level: Level }) {
  const reduce = useReducedMotion();
  const revealed = variant.revealed === true;
  const waiting = !revealed && !heard;
  const [machinePlaced, setMachinePlaced] = useState(revealed);
  const [wrongSpot, setWrongSpot] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busy = locked || solved || waiting;

  const after = placeMove(variant.board, variant.spokenMove.cell, 'O');
  const board = machinePlaced ? after : variant.board;
  const danger = machinePlaced && variant.livePreview ? threats(after, 'O') : [];
  const dangerCells =
    level === 'A'
      ? new Set(
          LINES.filter(
            (l) =>
              l.filter((i) => after[i] === 'O').length === 2 && l.some((i) => danger.includes(i)),
          ).flat(),
        )
      : new Set<number>();

  function click(i: number) {
    if (busy || board[i] !== '.') return;
    setFeedback(null);
    if (!machinePlaced) {
      // primeiro: onde a máquina jogou? (sem perder ponto: é só para conferir que escutaram)
      if (i === variant.spokenMove.cell) {
        setMachinePlaced(true);
        setWrongSpot(null);
      } else {
        setWrongSpot(i);
        setFeedback('Não foi aí que a máquina jogou. Escutem de novo a transmissão!');
      }
      return;
    }
    setPick(i);
  }

  function play() {
    if (busy || pick === null) return;
    if (!checkBoardChoice(variant, pick)) {
      setFeedback('A máquina sorriu... essa não era a melhor casa. Pensem de novo!');
      setPick(null);
      return onWrong();
    }
    setSolved(true);
    setTimeout(onSolved, 900);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
      <div className="flex flex-col items-center gap-2">
        {waiting && <WaitingTransmission />}
        <div
          role="grid"
          aria-label="Tabuleiro do jogo da velha"
          className="grid grid-cols-3 gap-1.5 rounded-md border-[3px] border-ink bg-night p-2 shadow-[0_0_24px_rgba(47,107,255,0.35)]"
        >
          {Array.from({ length: 9 }, (_, i) => {
            const v = board[i];
            const isMachine = machinePlaced && i === variant.spokenMove.cell;
            const isPick = pick === i;
            const hot = dangerCells.has(i);
            return (
              <button
                key={i}
                type="button"
                role="gridcell"
                disabled={busy || v !== '.'}
                onClick={() => click(i)}
                aria-label={`${cellName(i)}: ${v === 'X' ? 'X' : v === 'O' ? 'O' : isPick ? 'X escolhido' : 'vazia'}`}
                className={cn(
                  'relative grid h-20 w-20 cursor-pointer place-items-center rounded-sm border-2 font-heist text-5xl leading-none disabled:cursor-default sm:h-24 sm:w-24',
                  hot ? 'border-alert bg-[#2a0f14]' : 'border-[#2b3550] bg-graphite',
                  wrongSpot === i && 'outline-4 outline-alert',
                  v === '.' && !busy && 'hover:bg-graphite-light',
                )}
              >
                <span className="absolute top-0.5 left-1 font-type text-xs text-mist">{i + 1}</span>
                {v === 'X' && <span className="text-piratas text-glow-blue">X</span>}
                {v === 'O' && (
                  <motion.span
                    className="text-bando text-glow-red"
                    animate={
                      isMachine && !reduce && !solved ? { opacity: [1, 0.35, 1] } : undefined
                    }
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    O
                  </motion.span>
                )}
                {v === '.' && isPick && <span className="text-spotlight text-glow-brass">X</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex max-w-md flex-col gap-3">
        <p className="font-type text-base" aria-live="polite">
          {!machinePlaced
            ? waiting
              ? '🎧 A jogada da máquina vem pelo rádio.'
              : '1️⃣ Onde a máquina jogou? Cliquem na casa que a Narradora falou.'
            : pick === null
              ? '2️⃣ Agora é a vez de vocês (X): escolham uma casa.'
              : `Vocês vão jogar na ${cellName(pick)}. Confirmam?`}
        </p>
        {danger.length > 0 && level === 'B' && (
          <p className="border-2 border-dashed border-alert px-3 py-1 font-type text-sm">
            ⚠️ A máquina ameaça fechar uma linha!
          </p>
        )}
        {feedback && (
          <p
            role="status"
            className="border-2 border-dashed border-alert bg-night/40 px-3 py-1.5 font-type text-paper"
          >
            {feedback}
          </p>
        )}
        <SubmitButton disabled={busy || pick === null} onClick={play} icon="♟️">
          Jogar aqui
        </SubmitButton>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { PunchCardReadVariant, PunchCardWriteVariant } from '@/content/types';
import { checkPunchRead, checkPunchWrite } from '@/engine/challenges';
import { SubmitButton, WaitingTransmission, type ChallengeBaseProps } from './common';
import { LetterLegend, PunchCard } from './PunchCard';

type TransmissionProps = { heard: boolean };

/** punchCardRead (Bando): ler os furos e digitar a senha; a coluna rasgada vem da Narradora. */
export function PunchCardReadChallenge({
  variant,
  heard,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & TransmissionProps & { variant: PunchCardReadVariant }) {
  const [text, setText] = useState('');
  const [solved, setSolved] = useState(false);
  const letters = variant.decode === 'letters';

  function submit() {
    if (locked || solved || !text.trim()) return;
    if (!checkPunchRead(variant, text)) return onWrong();
    setSolved(true);
    setTimeout(onSolved, 600);
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-6">
      <div className="flex flex-col gap-2">
        <PunchCard
          rows={variant.rows}
          holes={variant.columns}
          spokenColumn={variant.spokenColumn}
          spokenStyle="torn"
          label={`Cartão perfurado com ${variant.columns.length} colunas; a coluna ${variant.spokenColumn + 1} está rasgada`}
        />
        <p className="font-type text-sm">
          🎧 A coluna {variant.spokenColumn + 1} está rasgada: escutem a Narradora!
        </p>
        {letters && <LetterLegend />}
      </div>
      <form
        className="flex w-56 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {!heard && <WaitingTransmission />}
        <label className="grid gap-1">
          <span className="font-type text-sm uppercase">Senha</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase().slice(0, 8))}
            disabled={!heard || locked || solved}
            inputMode={letters ? 'text' : 'numeric'}
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 border-[3px] border-ink bg-white px-3 text-center font-heist text-4xl tracking-[0.3em] text-ink disabled:opacity-50"
          />
        </label>
        <SubmitButton disabled={!heard || locked || solved || !text.trim()} onClick={submit} />
      </form>
    </div>
  );
}

/** punchCardWrite (Piratas): furar um buraco por coluna para formar a senha. */
export function PunchCardWriteChallenge({
  variant,
  heard,
  locked,
  onWrong,
  onSolved,
}: ChallengeBaseProps & TransmissionProps & { variant: PunchCardWriteVariant }) {
  const [holes, setHoles] = useState<(number | null)[]>(() => variant.target.map(() => null));
  const [solved, setSolved] = useState(false);
  const complete = holes.every((h) => h !== null);

  function submit() {
    if (locked || solved || !complete) return;
    if (!checkPunchWrite(variant, holes)) return onWrong();
    setSolved(true);
    setTimeout(onSolved, 600);
  }

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-6">
      <div className="flex flex-col gap-2">
        <PunchCard
          rows={variant.rows}
          holes={holes}
          spokenColumn={variant.spokenColumn}
          spokenStyle="wet"
          spokenUnlocked={heard}
          disabled={locked || solved}
          onPunch={(c, r) => setHoles((h) => h.map((v, i) => (i === c ? (v === r ? null : r) : v)))}
          label="Cartão para furar: clique numa casa para furar aquela linha da coluna"
        />
        {variant.decode === 'letters' && <LetterLegend />}
      </div>
      <div className="flex w-56 flex-col gap-3">
        <div className="rounded-hand border-[3px] border-ink bg-white p-3 text-center">
          <p className="font-type text-xs uppercase">Mensagem na garrafa</p>
          <p className="font-heist text-4xl tracking-[0.3em] text-ink">{variant.shownTarget}</p>
        </div>
        {!heard && <WaitingTransmission />}
        <p className="text-sm">Um furo por coluna. Clique de novo para tirar o furo.</p>
        <SubmitButton disabled={locked || solved || !complete} onClick={submit} icon="🔒">
          Trancar
        </SubmitButton>
      </div>
    </div>
  );
}

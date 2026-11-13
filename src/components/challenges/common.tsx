import type { ReactNode } from 'react';
import { cn } from '@/components/comic';

/** Props comuns de todo desafio. Quem chama cuida dos pontos, do bloqueio de 3 s e da onomatopeia. */
export type ChallengeBaseProps = {
  /** bloqueado (3 s após erro, ou enviando) */
  locked: boolean;
  onWrong: () => void;
  onSolved: () => void;
};

/** Botão de resposta grande (≥ 44 px, foco visível, ícone + texto). */
export function AnswerButton({
  children,
  onClick,
  disabled,
  state = 'idle',
  letter,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  state?: 'idle' | 'right';
  letter?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-hand border-[3px] border-ink px-4 py-2 text-left font-body text-lg font-bold shadow-comic-sm transition-transform disabled:cursor-not-allowed disabled:opacity-60',
        state === 'right'
          ? 'bg-success text-ink'
          : 'bg-paper text-ink hover:-translate-y-0.5 hover:bg-spotlight',
      )}
    >
      {letter && (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-ink font-heist text-xl text-paper">
          {state === 'right' ? '✔' : letter}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

/** Botão principal de envio do desafio. */
export function SubmitButton({
  children = 'Enviar',
  onClick,
  disabled,
  icon = '🔓',
}: {
  children?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-hand-alt border-4 border-ink bg-bando px-6 pt-1 font-heist text-2xl tracking-wider text-paper shadow-comic hover:glow-red disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span aria-hidden>{icon}</span>
      {children}
    </button>
  );
}

/** Aviso de espera pela transmissão da Narradora (RN-45). */
export function WaitingTransmission() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 border-2 border-dashed border-brass bg-night/40 px-3 py-2 font-type text-brass"
    >
      <span aria-hidden className="text-2xl">
        🎧
      </span>
      Aguardando transmissão da Narradora...
    </p>
  );
}

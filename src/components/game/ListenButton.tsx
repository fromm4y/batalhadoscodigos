import { useEffect, useState } from 'react';
import { speak, stopSpeaking, useHasPtVoice, useSpeakingId } from '@/audio/narration';
import { cn } from '@/components/comic';

/** 🔊 "Ouvir" (SPEC 10): lê o texto com voz pt-BR. Some se o computador não tiver essa voz. */
export function ListenButton({ text, className }: { text: string; className?: string }) {
  const has = useHasPtVoice();
  const speaking = useSpeakingId();
  const [myId, setMyId] = useState<number | null>(null);
  const active = myId !== null && speaking === myId;
  // Mudou o texto (outro desafio): para a fala antiga.
  useEffect(() => () => stopSpeaking(), [text]);
  if (!has) return null;
  return (
    <button
      type="button"
      onClick={() => (active ? stopSpeaking() : setMyId(speak(text)))}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-md border-[3px] border-ink px-3 pt-1 font-heist text-lg tracking-wider',
        active ? 'bg-brass text-ink glow-brass' : 'bg-paper text-ink hover:glow-brass',
        className,
      )}
    >
      {active ? '⏹ Parar' : '🔊 Ouvir'}
    </button>
  );
}

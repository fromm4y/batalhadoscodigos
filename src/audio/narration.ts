import { useEffect, useState } from 'react';
import { duckMusic } from './engine';

/**
 * Narração (SPEC 10): Web Speech API com voz pt-BR. Sem voz pt-BR no computador,
 * o botão "Ouvir" some (não adianta ler em inglês para quem está aprendendo a ler).
 */
function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

export function ptVoice(): SpeechSynthesisVoice | null {
  const voices = synth()?.getVoices() ?? [];
  return (
    voices.find((v) => v.lang === 'pt-BR') ??
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-br') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ??
    null
  );
}

/** Há voz pt-BR? As vozes do Chrome chegam depois, pelo evento `voiceschanged`. */
export function useHasPtVoice(): boolean {
  const [has, setHas] = useState(() => !!ptVoice());
  useEffect(() => {
    const s = synth();
    if (!s) return;
    const check = () => setHas(!!ptVoice());
    s.addEventListener('voiceschanged', check);
    check();
    return () => s.removeEventListener('voiceschanged', check);
  }, []);
  return has;
}

let speakingId = 0;
const listeners = new Set<(id: number | null) => void>();
let currentId: number | null = null;
function setCurrent(id: number | null) {
  currentId = id;
  duckMusic(id !== null);
  listeners.forEach((l) => l(id));
}

/** Lê o texto em voz alta; devolve um id para saber se ainda é esta fala que está tocando. */
export function speak(text: string): number | null {
  const s = synth();
  const voice = ptVoice();
  if (!s || !voice) return null;
  s.cancel();
  const id = ++speakingId;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  u.onend = u.onerror = () => {
    if (currentId === id) setCurrent(null);
  };
  setCurrent(id);
  s.speak(u);
  return id;
}

export function stopSpeaking() {
  synth()?.cancel();
  setCurrent(null);
}

/** Id da fala que está tocando agora (ou null). */
export function useSpeakingId(): number | null {
  const [id, setId] = useState(currentId);
  useEffect(() => {
    listeners.add(setId);
    return () => {
      listeners.delete(setId);
    };
  }, []);
  return id;
}

import { create } from 'zustand';
import { GAME_RULES } from '@/config/gameRules';
import { playSfx, setLevels, unlockAudio, type SfxName } from './engine';

type Prefs = { music: number; sfx: number; muted: boolean };
type AudioState = Prefs & {
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMute: () => void;
};

const KEY = 'cacada.audio';
const DEFAULTS: Prefs = {
  music: GAME_RULES.audio.defaultMusicVolume,
  sfx: GAME_RULES.audio.defaultSfxVolume,
  muted: false,
};
const clamp = (v: unknown, d: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d;

function load(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Prefs>;
    return {
      music: clamp(raw.music, DEFAULTS.music),
      sfx: clamp(raw.sfx, DEFAULTS.sfx),
      muted: raw.muted === true,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(p: Prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // sem armazenamento (aba anônima bloqueada): segue só na memória
  }
}

/** Preferências de som (SPEC 10): sliders de música e efeitos + mudo, salvas no navegador. */
export const useAudio = create<AudioState>((set, get) => {
  const apply = (patch: Partial<Prefs>) => {
    const { music, sfx, muted } = { ...get(), ...patch };
    set({ music, sfx, muted });
    save({ music, sfx, muted });
    setLevels({ music, sfx, muted });
  };
  return {
    ...load(),
    setMusicVolume: (v) => apply({ music: clamp(v, DEFAULTS.music) }),
    setSfxVolume: (v) => apply({ sfx: clamp(v, DEFAULTS.sfx) }),
    toggleMute: () => apply({ muted: !get().muted }),
  };
});

setLevels(useAudio.getState());

/** Liga o áudio no primeiro gesto do usuário (política de autoplay). */
export function installAudioUnlock() {
  const once = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', once);
    window.removeEventListener('keydown', once);
  };
  window.addEventListener('pointerdown', once);
  window.addEventListener('keydown', once);
}

export const sfx = (name: SfxName) => playSfx(name);

import { useEffect } from 'react';
import { playSfx, type SfxName } from './engine';

/** Toca um efeito quando o componente aparece (alarme, prisão, transmissão...). */
export function useSfxOnMount(name: SfxName, delayMs = 0) {
  useEffect(() => {
    const t = setTimeout(() => playSfx(name), delayMs);
    return () => clearTimeout(t);
  }, [name, delayMs]);
}

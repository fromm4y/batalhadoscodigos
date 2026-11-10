export type OnomatopoeiaKind = 'click' | 'boom' | 'alarm' | 'zzzt' | 'tcha' | 'errou' | 'custom';

/** Onomatopeias oficiais (SPEC 9.6 / VISUAL.md §6): estouram com brilho sobre o escuro. */
export const ONOMATOPOEIA: Record<
  Exclude<OnomatopoeiaKind, 'custom'>,
  { text: string; burst: string; textColor: string; glow: string }
> = {
  click: { text: 'CLICK!', burst: '#2BB673', textColor: '#EDE3CC', glow: '#2BB673' },
  boom: { text: 'BOOM!', burst: '#D4A537', textColor: '#E63946', glow: '#FFD36B' },
  alarm: { text: 'UÓ-UÓ!', burst: '#E63946', textColor: '#FFF4C2', glow: '#E63946' },
  zzzt: { text: 'ZZZT!', burst: '#8B5CF6', textColor: '#EDE3CC', glow: '#A78BFA' },
  tcha: { text: 'TCHÁ!', burst: '#2F6BFF', textColor: '#FFF4C2', glow: '#2F6BFF' },
  errou: { text: 'ERROU!', burst: '#FF8C00', textColor: '#EDE3CC', glow: '#FF8C00' },
};

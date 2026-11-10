export type OnomatopoeiaKind = 'click' | 'boom' | 'alarm' | 'zzzt' | 'tcha' | 'errou' | 'custom';

/** Textos e cores das onomatopeias oficiais do jogo (SPEC 9.6). */
export const ONOMATOPOEIA: Record<
  Exclude<OnomatopoeiaKind, 'custom'>,
  { text: string; burst: string; textColor: string }
> = {
  click: { text: 'CLICK!', burst: '#2BB673', textColor: '#FFF8E7' },
  boom: { text: 'BOOM!', burst: '#F4C430', textColor: '#E63946' },
  alarm: { text: 'UÓ-UÓ!', burst: '#E63946', textColor: '#F4C430' },
  zzzt: { text: 'ZZZT!', burst: '#7C3AED', textColor: '#FFF8E7' },
  tcha: { text: 'TCHÁ!', burst: '#1D4ED8', textColor: '#F4C430' },
  errou: { text: 'ERROU!', burst: '#FF8C00', textColor: '#FFF8E7' },
};

import type { AvatarConfig } from '@/types/domain';

/** Opções do avatar (SPEC 9.5): cores e nomes das peças mostrados no criador. */
export const SKIN_TONES = [
  '#F6D2B6',
  '#E8B48F',
  '#C98C62',
  '#A06A43',
  '#7A4A2A',
  '#4E2E1A',
] as const;
export const HAIR_COLORS = ['#1B1410', '#4A2F1D', '#8A5A2B', '#D9A441', '#B5482A'] as const;

export const HAIR_LABELS = [
  'Black power',
  'Cacheado',
  'Curtinho',
  'Liso longo',
  'Tranças',
  'Coque',
  'Rabo de cavalo',
  'Raspadinho',
] as const;
export const EYES_LABELS = ['Pontinhos', 'Felizes', 'Brilhantes', 'Determinados'] as const;
export const MOUTH_LABELS = ['Sorriso', 'Risada', 'Surpresa', 'De lado'] as const;
export const ACCESSORY_LABELS = ['Nenhum', 'Óculos', 'Fone', 'Bandana'] as const;

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 3,
  hair: 1,
  hairColor: 1,
  eyes: 1,
  mouth: 1,
  accessory: 0,
};

const pick = <T extends number>(max: number, min = 1) =>
  (min + Math.floor(Math.random() * (max - min + 1))) as T;

export function randomAvatar(): AvatarConfig {
  return {
    skin: pick(6),
    hair: pick(8),
    hairColor: pick(5),
    eyes: pick(4),
    mouth: pick(4),
    accessory: pick(3, 0),
  };
}

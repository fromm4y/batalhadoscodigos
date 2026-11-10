import type { AvatarConfig } from '@/types/domain';

/** Dados FALSOS só para o protótipo visual (sem Firebase). */
export type SampleTeam = { city: string; pirate: string; avatar: AvatarConfig; points: number };

export const MY_TEAM: SampleTeam = {
  city: 'Recife',
  pirate: 'Âncora Dourada',
  avatar: { skin: 4, hair: 1, hairColor: 1, eyes: 1, mouth: 1, accessory: 0 },
  points: 12,
};

const av = (
  skin: AvatarConfig['skin'],
  hair: AvatarConfig['hair'],
  hairColor: AvatarConfig['hairColor'],
): AvatarConfig => ({
  skin,
  hair,
  hairColor,
  eyes: 1,
  mouth: 1,
  accessory: 0,
});

export const RED_TEAMS: SampleTeam[] = [
  { city: 'Manaus', pirate: 'Polvo Sabido', avatar: av(2, 2, 2), points: 9 },
  { city: 'Floripa', pirate: 'Maré Alta', avatar: av(6, 1, 1), points: 15 },
  { city: 'Belém', pirate: 'Vela Rasgada', avatar: av(1, 4, 4), points: 7 },
];

export const BLUE_TEAMS: SampleTeam[] = [
  { city: 'Natal', pirate: 'Tubarão Risonho', avatar: av(3, 3, 3), points: 11 },
  { city: 'Palmas', pirate: 'Pérola Azul', avatar: av(5, 1, 5), points: 14 },
  { city: 'Vitória', pirate: 'Siri Sorrateiro', avatar: av(4, 2, 2), points: 6 },
];

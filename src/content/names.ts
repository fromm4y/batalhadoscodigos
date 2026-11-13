/**
 * Listas fechadas de nomes (seção 9.5 / RN-49). Sem texto livre.
 * Decisão da May (13/11): também valem os nomes dos personagens da série e do anime
 * (só os NOMES; imagens, logos e músicas oficiais continuam proibidos).
 */

/** Bando: codinomes de personagem da série de assalto. */
export const HEIST_CHARACTER_NAMES = [
  'Tóquio',
  'Berlim',
  'Nairóbi',
  'Rio',
  'Denver',
  'Moscou',
  'Helsinque',
  'Oslo',
  'Lisboa',
  'Estocolmo',
  'Palermo',
  'Bogotá',
  'Marselha',
  'Manila',
  'Pamplona',
] as const;

/** Piratas: nomes de personagem do anime de piratas. */
export const PIRATE_CHARACTER_NAMES = [
  'Luffy',
  'Zoro',
  'Nami',
  'Usopp',
  'Sanji',
  'Chopper',
  'Robin',
  'Franky',
  'Brook',
  'Jinbe',
  'Ace',
  'Sabo',
  'Shanks',
  'Law',
  'Vivi',
  'Hancock',
  'Yamato',
  'Carrot',
  'Buggy',
  'Koby',
] as const;

/** Bando: cidades do Brasil. */
export const BRAZIL_CITY_NAMES = [
  'Manaus',
  'Recife',
  'Floripa',
  'Barueri',
  'Salvador',
  'Belém',
  'Natal',
  'Cuiabá',
  'Curitiba',
  'Fortaleza',
  'Goiânia',
  'Maceió',
  'Vitória',
  'Palmas',
  'Macapá',
  'Aracaju',
  'Teresina',
  'Porto Alegre',
  'São Luís',
  'Boa Vista',
] as const;

/** Piratas: apelidos piratas originais. */
export const ORIGINAL_PIRATE_NAMES = [
  'Tubarão Risonho',
  'Âncora Dourada',
  'Olho de Coral',
  'Barba de Algas',
  'Gaivota Veloz',
  'Polvo Sabido',
  'Canhão Gentil',
  'Maré Alta',
  'Bússola Torta',
  'Concha Brilhante',
  'Tempestade Mansa',
  'Baleia Dançarina',
  'Arpão Prateado',
  'Caranguejo Valente',
  'Vela Rasgada',
  'Siri Sorrateiro',
  'Estrela-do-Mar',
  'Coral Vermelho',
  'Mapa Perdido',
  'Pérola Azul',
] as const;

/** Todas as opções do Bando (o servidor valida contra esta lista). */
export const CITY_NAMES = [...HEIST_CHARACTER_NAMES, ...BRAZIL_CITY_NAMES] as const;
/** Todas as opções dos Piratas. */
export const PIRATE_NAMES = [...PIRATE_CHARACTER_NAMES, ...ORIGINAL_PIRATE_NAMES] as const;

/** Abas da escolha de nome (cada aba cabe na tela). */
export const NAME_GROUPS = {
  red: [
    { label: 'Personagens', names: HEIST_CHARACTER_NAMES },
    { label: 'Cidades do Brasil', names: BRAZIL_CITY_NAMES },
  ],
  blue: [
    { label: 'Personagens', names: PIRATE_CHARACTER_NAMES },
    { label: 'Nomes piratas', names: ORIGINAL_PIRATE_NAMES },
  ],
} as const;

export type CityName = (typeof CITY_NAMES)[number];
export type PirateName = (typeof PIRATE_NAMES)[number];

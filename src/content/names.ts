/** Listas fechadas de nomes (seção 9.5 / RN-49). Sem texto livre. */

export const CITY_NAMES = [
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

export const PIRATE_NAMES = [
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

export type CityName = (typeof CITY_NAMES)[number];
export type PirateName = (typeof PIRATE_NAMES)[number];

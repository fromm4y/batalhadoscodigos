/**
 * Escolas atendidas (seed, SPEC 6.3). O id é estável e vira o id do documento em `schools/`.
 * O app lê as escolas do Firestore; esta lista só alimenta o seed.
 */
export const SCHOOLS = [
  { id: 'meduneckas', name: 'Meduneckas' },
  { id: 'cavazza', name: 'Cavazza' },
  { id: 'camisao', name: 'Camisão' },
  { id: 'adherbal', name: 'Adherbal' },
  { id: 'emidio', name: 'Emídio' },
] as const;

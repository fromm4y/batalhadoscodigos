/**
 * Escolas atendidas (seed, SPEC 6.3). O id é estável e vira o id do documento em `schools/`.
 * O app lê as escolas do Firestore; esta lista só alimenta o seed (`/api/setup`).
 * Lista enviada pela May em 15/11, agrupada por professor(a). A EMEIEF José Emidio de Aguiar
 * é atendida pela Mayara e pelo Julio (aparece uma vez só).
 */
export const SCHOOLS = [
  // Professora Mayara
  { id: 'adherbal', name: 'EMEIEF Benedito Adherbal Farbo' },
  { id: 'cavazza', name: 'EMEF Armando Cavazza' },
  { id: 'emidio', name: 'EMEIEF José Emidio de Aguiar' },
  { id: 'meduneckas', name: 'EMEF Professora Maria Meduneckas' },
  { id: 'camisao', name: 'EMEF Júlio Gomes Camisão' },
  // Professor Guilherme
  { id: 'renato-rosa', name: 'EMEF Renato Rosa' },
  { id: 'nestor-camargo', name: 'EMEF Pref. Nestor de Camargo' },
  { id: 'ezio-berzaghi', name: 'EMEF Prof. Ézio Berzaghi' },
  { id: 'eneias-silva', name: 'EMEIEF Prof. Eneias R. da Silva' },
  { id: 'osmarinho-lima', name: 'Comp. Ed. Prof. C. Osmarinho de Lima' },
  // Professor Francisco
  { id: 'egidio-costa', name: 'EMEF Professor Egídio Costa' },
  // Professor Dante
  { id: 'francisco-zacarioto', name: 'EMEF Francisco Zacarioto' },
  { id: 'rita-de-jesus', name: 'EMEF Rita de Jesus' },
  { id: 'dalva-fogaca', name: 'EMEF Professora Dalva Fogaça' },
  { id: 'joao-tiburcio', name: 'EMEF Prof. João Tibúrcio Silva Filho' },
  { id: 'anna-irene', name: 'EMEIEF Anna Irene Mazaro de Freitas' },
  // Professor Julio (também atende a José Emidio de Aguiar, acima)
  { id: 'elisabet-titto', name: 'EMEIEF Vereadora Elisabet Titto' },
] as const;

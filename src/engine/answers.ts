/**
 * RN-28: normalização de respostas digitadas.
 * Minúsculas, sem acentos, sem pontuação e sem espaços duplicados.
 */
export function normalizeAnswer(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // pontuação vira espaço
    .replace(/\s+/g, ' ')
    .trim();
}

/** A resposta bate com alguma das variantes aceitas (já normalizadas no JSON)? */
export function matchesAccepted(raw: string, accept: string[]): boolean {
  const n = normalizeAnswer(raw);
  return n.length > 0 && accept.some((a) => normalizeAnswer(a) === n);
}

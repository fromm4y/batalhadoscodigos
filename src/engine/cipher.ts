/** Cifra de deslocamento A–Z (Ep. 2, SPEC-03 §1). Outras letras e espaços passam iguais. */
export function shiftText(text: string, shift: number): string {
  const k = ((shift % 26) + 26) % 26;
  return text
    .toUpperCase()
    .split('')
    .map((c) =>
      c >= 'A' && c <= 'Z' ? String.fromCharCode(((c.charCodeAt(0) - 65 + k) % 26) + 65) : c,
    )
    .join('');
}
export const decodeText = (text: string, shift: number) => shiftText(text, -shift);

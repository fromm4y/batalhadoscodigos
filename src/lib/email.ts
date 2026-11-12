/** Normaliza e-mail para usar como id em `allowedInstructors/{email}` (SPEC 5.3). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validação simples de formato (a confirmação real é o login Google). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

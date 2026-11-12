import { levelFromGrade } from '@/config/gameRules';
import type { Grade, Level, Shift } from '@/types/domain';

/** Limite de caracteres do nome da turma (espelha firestore.rules). */
export const CLASS_NAME_MAX = 30;
export const GRADES: Grade[] = [4, 5, 6, 7, 8, 9];
export const LEVELS: Level[] = ['A', 'B', 'C'];

export type ClassFormValues = {
  schoolId: string;
  name: string;
  grade: Grade | null;
  shift: Shift | null;
  /** null = usar o nível derivado da série (RN-01) */
  levelOverride: Level | null;
};

export type ClassFormErrors = Partial<Record<'schoolId' | 'name' | 'grade' | 'shift', string>>;

export const EMPTY_CLASS_FORM: ClassFormValues = {
  schoolId: '',
  name: '',
  grade: null,
  shift: null,
  levelOverride: null,
};

export function effectiveLevel(
  values: Pick<ClassFormValues, 'grade' | 'levelOverride'>,
): Level | null {
  if (values.levelOverride) return values.levelOverride;
  return values.grade ? levelFromGrade(values.grade) : null;
}

export function validateClassForm(values: ClassFormValues): ClassFormErrors {
  const errors: ClassFormErrors = {};
  if (!values.schoolId) errors.schoolId = 'Escolha a escola.';
  const name = values.name.trim();
  if (!name) errors.name = 'Dê um nome para a turma (ex.: 6º A).';
  else if (name.length > CLASS_NAME_MAX)
    errors.name = `Use no máximo ${CLASS_NAME_MAX} caracteres.`;
  if (!values.grade) errors.grade = 'Escolha a série.';
  if (!values.shift) errors.shift = 'Escolha o turno.';
  return errors;
}

/** Campos editáveis prontos para o Firestore (sem instructorId/createdAt/season). */
export function toClassFields(values: ClassFormValues) {
  const level = effectiveLevel(values);
  if (!values.grade || !values.shift || !level) throw new Error('Formulário de turma inválido.');
  return {
    schoolId: values.schoolId,
    name: values.name.trim(),
    grade: values.grade,
    shift: values.shift,
    level,
  };
}

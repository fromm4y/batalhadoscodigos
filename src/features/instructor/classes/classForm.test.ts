import { describe, expect, it } from 'vitest';
import { normalizeEmail, isValidEmail } from '@/lib/email';
import { EMPTY_CLASS_FORM, effectiveLevel, toClassFields, validateClassForm } from './classForm';

describe('normalizeEmail', () => {
  it('remove espaços e põe em minúsculas', () => {
    expect(normalizeEmail('  Maria.Silva@Escola.SP.gov.BR ')).toBe('maria.silva@escola.sp.gov.br');
  });
  it('valida formato básico', () => {
    expect(isValidEmail('ana@escola.br')).toBe(true);
    expect(isValidEmail('ana@escola')).toBe(false);
    expect(isValidEmail('ana escola.br')).toBe(false);
  });
});

describe('formulário de turma', () => {
  it('exige escola, nome, série e turno', () => {
    expect(Object.keys(validateClassForm(EMPTY_CLASS_FORM)).sort()).toEqual([
      'grade',
      'name',
      'schoolId',
      'shift',
    ]);
  });

  it('limita o nome a 30 caracteres', () => {
    const errors = validateClassForm({ ...EMPTY_CLASS_FORM, name: 'x'.repeat(31) });
    expect(errors.name).toBeDefined();
  });

  it('deriva o nível da série e aceita ajuste manual (RN-01)', () => {
    expect(effectiveLevel({ grade: 5, levelOverride: null })).toBe('A');
    expect(effectiveLevel({ grade: 7, levelOverride: null })).toBe('B');
    expect(effectiveLevel({ grade: 9, levelOverride: null })).toBe('C');
    expect(effectiveLevel({ grade: 9, levelOverride: 'B' })).toBe('B');
    expect(effectiveLevel({ grade: null, levelOverride: null })).toBeNull();
  });

  it('gera os campos limpos para salvar', () => {
    expect(
      toClassFields({
        schoolId: 'cavazza',
        name: '  6º A ',
        grade: 6,
        shift: 'tarde',
        levelOverride: null,
      }),
    ).toEqual({ schoolId: 'cavazza', name: '6º A', grade: 6, shift: 'tarde', level: 'B' });
  });
});

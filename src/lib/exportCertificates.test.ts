import { describe, expect, it } from 'vitest';
import { fileSafe } from './exportCertificates';

describe('nome do arquivo do certificado', () => {
  it('sem acento nem espaço', () => {
    expect(fileSafe('Belém · Pérola Azul')).toBe('belem-perola-azul');
    expect(fileSafe('5º A')).toBe('5-a');
  });
});

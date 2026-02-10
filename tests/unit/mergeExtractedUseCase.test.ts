import { describe, expect, it } from 'vitest';
import { mergeExtractedFields } from '@use-cases/patient/mergeExtracted';

describe('mergeExtractedFields use-case', () => {
  it('prefers existing valid base values and fills missing values from incoming', () => {
    const result = mergeExtractedFields(
      {
        name: '  ANA MARIA  ',
        rut: '1-9',
        birthDate: '',
        gender: '',
        diagnosis: 'Diagnostico base',
        clinicalNote: '',
      },
      {
        name: 'otra',
        rut: '2-7',
        birthDate: '2000-01-31',
        gender: 'f',
        diagnosis: 'Diagnostico IA',
        clinicalNote: 'Nota IA',
      }
    );

    expect(result).toMatchObject({
      name: 'Ana Maria',
      rut: '1-9',
      birthDate: '31-01-2000',
      gender: 'Femenino',
      diagnosis: 'Diagnostico base',
      clinicalNote: 'Nota IA',
    });
  });

  it('uses incoming value when base value is invalid after normalization', () => {
    const result = mergeExtractedFields(
      {
        name: 'Juan',
        rut: '123',
      },
      {
        rut: '2-7',
      }
    );

    expect(result.rut).toBe('2-7');
  });
});

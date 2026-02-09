import { describe, expect, it } from 'vitest';
import {
  extractPatientDataFromText,
  isValidRut,
  normalizeExtractedPatientData,
} from '@core/patient/utils/patientTextExtraction';

describe('patientTextExtraction', () => {
  it('validates RUTs correctly', () => {
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12.345.678-9')).toBe(false);
    expect(isValidRut('')).toBe(false);
  });

  it('normalizes extracted data', () => {
    const normalized = normalizeExtractedPatientData({
      name: '  María   López  ',
      rut: '12.345.678-5',
      birthDate: '1985/2/1',
      gender: 'f',
      diagnosis: 'Dx',
      clinicalNote: 'Nota',
    });
    expect(normalized.name).toBe('María López');
    expect(normalized.rut).toBe('12.345.678-5');
    expect(normalized.birthDate).toBe('01-02-1985');
    expect(normalized.gender).toBe('Femenino');
  });

  it('extracts patient data from text', () => {
    const text = `
      Nombre Completo: Juan Perez
      RUT: 12.345.678-5
      Fecha de Nacimiento: 1990-3-7
      Sexo: Masculino
      HIPOTESIS DIAGNOSTICA: Dolor abdominal.
      INDICACIONES MEDICAS: Reposo.
    `;

    const data = extractPatientDataFromText(text);
    expect(data.name).toBe('Juan Perez');
    expect(data.rut).toBe('12.345.678-5');
    expect(data.birthDate).toBe('07-03-1990');
    expect(data.gender).toBe('Masculino');
    expect(data.diagnosis).toContain('Dolor abdominal');
    expect(data.clinicalNote).toContain('Reposo');
  });
});

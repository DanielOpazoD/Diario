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

  it('rejects common non-name terms as patient name', () => {
    const textSocial = `
      Nombre: Social
      RUT: 12.345.678-5
      Sexo: Masculino
    `;
    const dataSocial = extractPatientDataFromText(textSocial);
    expect(dataSocial.name).toBe('');

    const textFonasa = `
      Nombre: Fonasa
      RUT: 12.345.678-5
    `;
    const dataFonasa = extractPatientDataFromText(textFonasa);
    expect(dataFonasa.name).toBe('');

    const textCombo = `
      Nombre: Servicio Hospital
      RUT: 12.345.678-5
    `;
    const dataCombo = extractPatientDataFromText(textCombo);
    expect(dataCombo.name).toBe('');
  });

  it('accepts valid multi-word names even if one word is a common term', () => {
    const text = `
      Nombre: María Servicio López
      RUT: 12.345.678-5
    `;
    const data = extractPatientDataFromText(text);
    expect(data.name).toContain('María');
  });

  it('extracts name from table-format NOMBRES: header with value on next line', () => {
    const text = `
      DATOS DEL PACIENTE E INGRESO:
      NOMBRES: NOMBRE SOCIAL: RUT: NACIMIENTO: EDAD:
      ELENA ARAKI 5630370-7 26-03-1944 82 años(s)
      RIROROKO
      SEXO: IDENTIDAD DE PREVISIÓN: DIRECCIÓN: COMUNA:
      MUJER GÉNERO: FONASA A AVDA. PONT S/N ISLA DE PASCUA
    `;
    const data = extractPatientDataFromText(text);
    expect(data.name).toContain('Elena');
    expect(data.name).toContain('Araki');
    expect(data.name).toContain('Riroroko');
  });

  it('extracts name from NOMBRES: on same line when value appears before next header', () => {
    const text = `
      NOMBRES: ELENA ARAKI RUT: 5630370-7
      Sexo: Mujer
    `;
    const data = extractPatientDataFromText(text);
    expect(data.name).toContain('Elena');
    expect(data.name).toContain('Araki');
  });
});

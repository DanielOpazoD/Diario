import { sanitizePatientName, sanitizeRut } from '@shared/utils/sanitization';
import { formatPatientName } from '@core/patient/utils/patientUtils';
import type { ExtractedPatientData } from '@shared/types';

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeGender = (value?: string): string => {
  if (!value) return '';
  const normalized = value.toLowerCase();
  if (['m', 'masculino', 'hombre', 'varon', 'varón'].some(v => normalized.includes(v))) {
    return 'Masculino';
  }
  if (['f', 'femenino', 'mujer'].some(v => normalized.includes(v))) {
    return 'Femenino';
  }
  return 'Otro';
};

const normalizeBirthDate = (value?: string): string => {
  if (!value) return '';
  const raw = value.trim();

  const isoMatch = raw.match(/\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const dmyMatch = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
  if (dmyMatch) {
    const [, day, month, yearRaw] = dmyMatch;
    let year = yearRaw;
    if (year.length === 2) {
      const yearNum = Number(year);
      year = yearNum < 30 ? `20${year}` : `19${year}`;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return '';
};

export const isValidRut = (rut: string): boolean => {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
  return expected === dv;
};

const extractLineValue = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeWhitespace(match[1]);
    }
  }
  return '';
};

const extractSection = (text: string, startLabels: string[], stopLabels: string[]) => {
  const lowerText = text.toLowerCase();
  let startIndex = -1;
  let foundLabel = '';

  for (const label of startLabels) {
    const idx = lowerText.indexOf(label.toLowerCase());
    if (idx !== -1) {
      startIndex = idx;
      foundLabel = label;
      break;
    }
  }

  if (startIndex === -1) return '';

  let endIndex = lowerText.length;
  for (const label of stopLabels) {
    const idx = lowerText.indexOf(label.toLowerCase(), startIndex + foundLabel.length);
    if (idx !== -1) {
      endIndex = Math.min(endIndex, idx);
    }
  }

  const rawSection = text.slice(startIndex + foundLabel.length, endIndex);
  return normalizeWhitespace(rawSection.replace(/[:\-]/, ''));
};

export const normalizeExtractedPatientData = (data: Partial<ExtractedPatientData>): Partial<ExtractedPatientData> => {
  const cleanedRut = sanitizeRut(data.rut || '');
  const normalizedRut = cleanedRut && isValidRut(cleanedRut) ? cleanedRut : '';

  return {
    name: data.name ? formatPatientName(sanitizePatientName(data.name)) : '',
    rut: normalizedRut,
    birthDate: normalizeBirthDate(data.birthDate || ''),
    gender: normalizeGender(data.gender || ''),
    diagnosis: data.diagnosis || '',
    clinicalNote: data.clinicalNote || '',
  };
};

export const extractPatientDataFromText = (text: string): Partial<ExtractedPatientData> => {
  const name = extractLineValue(text, [
    /Nombre\s*(?:Completo|y\s*Apellido)?\s*[:\-]\s*([^\n]+)/i,
    /Paciente\s*[:\-]\s*([^\n]+)/i,
  ]);

  const rut = extractLineValue(text, [
    /\b(\d{1,2}\.\d{3}\.\d{3}-[0-9kK])\b/,
    /\b(\d{7,8}-[0-9kK])\b/,
  ]);

  const birthDate = extractLineValue(text, [
    /Fecha\s*de\s*Nacimiento\s*[:\-]\s*([^\n]+)/i,
    /F\.?\s*Nac\.?\s*[:\-]\s*([^\n]+)/i,
    /Nacimiento\s*[:\-]\s*([^\n]+)/i,
  ]);

  const gender = extractLineValue(text, [
    /Sexo\s*[:\-]\s*([^\n]+)/i,
    /G[eé]nero\s*[:\-]\s*([^\n]+)/i,
  ]);

  const diagnosis = extractSection(
    text,
    ['HIPOTESIS DIAGNOSTICA', 'HIPÓTESIS DIAGNÓSTICA', 'DIAGNOSTICO'],
    ['INDICACIONES', 'PLAN', 'EVOLUCIÓN', 'EVOLUCION', 'COMENTARIO', 'TRATAMIENTO']
  );

  const clinicalNote = extractSection(
    text,
    ['INDICACIONES MÉDICAS / PLAN DE TTO', 'INDICACIONES MEDICAS', 'PLAN', 'EVOLUCIÓN', 'EVOLUCION', 'COMENTARIO'],
    ['DIAGNOSTICO', 'HIPOTESIS', 'HIPÓTESIS', 'ANTECEDENTES']
  );

  return normalizeExtractedPatientData({
    name,
    rut,
    birthDate,
    gender,
    diagnosis,
    clinicalNote,
  });
};

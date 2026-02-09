import { normalizeBirthDate } from '@domain/patient/dates';
import { sanitizePatientName, sanitizeRut } from '@shared/utils/sanitization';
import { formatPatientName } from '@shared/utils/patientUtils';
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

const NAME_LINE_PATTERN = /^(?:Nombre(?:\s+Completo)?|Paciente)\s*[:\-]?\s*(.+)$/i;
const FALLBACK_NAME_PATTERN =
  /Nombre\s*(?:Completo|y\s*Apellido)?\s*[:\-]?\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]{2,})/i;

const FIELD_PATTERNS = {
  name: [
    /Nombre\s*(?:Completo|y\s*Apellido)?\s*[:\-]\s*([^\n]+)/i,
    /Paciente\s*[:\-]\s*([^\n]+)/i,
    /^\s*Nombre\s*(?:Completo|y\s*Apellido)?\s+([^\n]+)/im,
  ],
  rut: [
    /\b(\d{1,2}\.\d{3}\.\d{3}-[0-9kK])\b/,
    /\b(\d{7,8}-[0-9kK])\b/,
  ],
  birthDate: [
    /Fecha\s*de\s*Nacimiento\s*[:\-]\s*([^\n]+)/i,
    /F\.?\s*Nac\.?\s*[:\-]\s*([^\n]+)/i,
    /Nacimiento\s*[:\-]\s*([^\n]+)/i,
  ],
  gender: [
    /Sexo\s*[:\-]\s*([^\n]+)/i,
    /G[eé]nero\s*[:\-]\s*([^\n]+)/i,
  ],
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
  const normalizedText = text.replace(/\r/g, '');
  const name = extractLineValue(normalizedText, FIELD_PATTERNS.name);
  const fallbackNameMatch = normalizedText.match(FALLBACK_NAME_PATTERN);
  const fallbackName = fallbackNameMatch ? normalizeWhitespace(fallbackNameMatch[1]) : '';
  const findNameInLines = () => {
    const lines = normalizedText.split('\n').map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(NAME_LINE_PATTERN);
      if (match?.[1]) {
        return normalizeWhitespace(match[1]);
      }
    }
    return '';
  };
  const finalName = name || fallbackName || findNameInLines();

  const rut = extractLineValue(normalizedText, FIELD_PATTERNS.rut);

  const birthDate = extractLineValue(normalizedText, FIELD_PATTERNS.birthDate);

  const gender = extractLineValue(normalizedText, FIELD_PATTERNS.gender);

  const diagnosis = extractSection(
    normalizedText,
    ['HIPOTESIS DIAGNOSTICA', 'HIPÓTESIS DIAGNÓSTICA', 'DIAGNOSTICO'],
    ['INDICACIONES', 'PLAN', 'EVOLUCIÓN', 'EVOLUCION', 'COMENTARIO', 'TRATAMIENTO']
  );

  const clinicalNote = extractSection(
    normalizedText,
    ['INDICACIONES MÉDICAS / PLAN DE TTO', 'INDICACIONES MEDICAS', 'PLAN', 'EVOLUCIÓN', 'EVOLUCION', 'COMENTARIO'],
    ['DIAGNOSTICO', 'HIPOTESIS', 'HIPÓTESIS', 'ANTECEDENTES']
  );

  return normalizeExtractedPatientData({
    name: finalName,
    rut,
    birthDate,
    gender,
    diagnosis,
    clinicalNote,
  });
};

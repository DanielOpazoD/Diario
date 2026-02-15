import { normalizeBirthDate } from '@domain/patient/dates';
import { sanitizePatientName, sanitizeRut } from '@shared/utils/sanitization';
import { formatPatientName } from '@shared/utils/patientUtils';
import type { ExtractedPatientData } from '@shared/types';
import { DEFAULT_PATIENT_TYPE_ID } from '@shared/constants/patientDefaults';

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

const NON_NAME_TERMS = new Set([
  'social', 'fonasa', 'isapre', 'medico', 'medica', 'prevision',
  'previsional', 'paciente', 'doctor', 'doctora', 'enfermero', 'enfermera',
  'hospital', 'clinica', 'servicio', 'urgencia', 'consulta',
  'ambulatorio', 'hospitalizado', DEFAULT_PATIENT_TYPE_ID, 'turno',
  'diagnostico', 'tratamiento', 'indicaciones', 'evolucion',
  'antecedentes', 'comentario', 'plan', 'fecha', 'ficha',
  'rut', 'run', 'nombre', 'nombres', 'sexo', 'genero',
  'edad', 'nacimiento', 'comuna', 'direccion', 'telefono',
  'nacionalidad', 'identidad', 'datos', 'ingreso', 'registro',
]);

const isLikelyName = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) return false;
  // Strip punctuation from each word and keep only meaningful (2+ char) words
  const words = trimmed.toLowerCase().split(/\s+/)
    .map(w => w.replace(/[^a-záéíóúüñ]/gi, ''))
    .filter(w => w.length > 1);
  // No meaningful words (only single chars or punctuation) => reject
  if (words.length === 0) return false;
  // A single word that is a common non-name term is not a valid name
  if (words.length === 1 && NON_NAME_TERMS.has(words[0])) return false;
  // All meaningful words are non-name terms — reject
  if (words.length > 1 && words.every(w => NON_NAME_TERMS.has(w))) return false;
  return true;
};

const NAME_LINE_PATTERN = /^(?:Nombre(?:\s+Completo)?|Paciente)\s*[:\-]?\s*(.+)$/i;
const FALLBACK_NAME_PATTERN =
  /Nombre\s*(?:Completo|y\s*Apellido|del\s*Paciente)?\s*[:\-]?\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]{2,})/i;

const FIELD_PATTERNS = {
  name: [
    /Nombre\s*(?:Completo|y\s*Apellido)?\s*[:\-]\s*([^\n]+)/i,
    /Nombre\s*del\s*Paciente\s*[:\-]\s*([^\n]+)/i,
    /Paciente\s*[:\-]\s*([^\n]+)/i,
    /^\s*Nombre\s*(?:Completo|y\s*Apellido)?\s+([^\n]+)/im,
  ],
  rut: [
    /(?:RUT|RUN)\s*[:\-]?\s*([0-9.\-kK\s]{8,16})/i,
    /\b(\d{1,2}(?:\.\d{3}){2}\s*-\s*[0-9kK])\b/,
    /\b(\d{7,8}\s*-\s*[0-9kK])\b/,
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

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const extractSection = (text: string, startLabels: string[], stopLabels: string[]) => {
  const normalizedLower = stripAccents(text.toLowerCase());
  let startIndex = -1;
  let foundLabel = '';

  for (const label of startLabels) {
    const idx = normalizedLower.indexOf(stripAccents(label.toLowerCase()));
    if (idx !== -1) {
      startIndex = idx;
      foundLabel = label;
      break;
    }
  }

  if (startIndex === -1) return '';

  let endIndex = normalizedLower.length;
  for (const label of stopLabels) {
    const idx = normalizedLower.indexOf(stripAccents(label.toLowerCase()), startIndex + foundLabel.length);
    if (idx !== -1) {
      endIndex = Math.min(endIndex, idx);
    }
  }

  const rawSection = text.slice(startIndex + foundLabel.length, endIndex);
  return normalizeWhitespace(rawSection.replace(/^[:\-\s]+/, ''));
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

  // Table-format extraction for Chilean medical PDFs (e.g., "NOMBRES:" header with value on next line)
  const extractNameFromTableFormat = (): string => {
    const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length - 1; i += 1) {
      if (!/\bNOMBRES?\s*:/i.test(lines[i])) continue;

      // Strategy 1: Name on the same line between NOMBRES: and the next field label
      const nombresMatch = lines[i].match(/\bNOMBRES?\s*:\s*/i);
      if (nombresMatch) {
        const afterLabel = lines[i].slice((nombresMatch.index ?? 0) + nombresMatch[0].length);
        const sameLineMatch = afterLabel.match(
          /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]{2,}?)(?=\s+(?:NOMBRE\s*SOCIAL|RUT\b|RUN\b|NACIMIENTO|EDAD|SEXO|PREVISI))/i
        );
        if (sameLineMatch?.[1]) {
          const candidate = normalizeWhitespace(sameLineMatch[1]);
          if (isLikelyName(candidate) && candidate.length >= 3) return candidate;
        }
      }

      // Strategy 2: Name on the next line (table header row / value row format)
      const nextLine = lines[i + 1];
      // Skip if next line looks like another header row
      if (/(?:^SEXO\b|^NACIONALIDAD\b|^IDENTIDAD\b)/i.test(nextLine)) continue;
      // Extract alphabetic text from the beginning until a number, colon-based label, or end
      const nextLineMatch = nextLine.match(
        /^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]{2,}?)(?=\s+\d|\s+[A-ZÁÉÍÓÚÜÑ]{3,}\s*:|\s*$)/
      );
      if (!nextLineMatch?.[1]) continue;
      let candidateName = normalizeWhitespace(nextLineMatch[1]);

      // Check for surname continuation on the following line (e.g., "RIROROKO")
      if (i + 2 < lines.length) {
        const thirdLine = lines[i + 2].trim();
        if (
          /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\s-]+$/.test(thirdLine) &&
          !/\b(?:SEXO|MUJER|HOMBRE|NACIONALIDAD|IDENTIDAD|PREVISI|TELEFONO|DIRECCION)/i.test(thirdLine)
        ) {
          const continuation = normalizeWhitespace(thirdLine);
          if (isLikelyName(continuation)) {
            candidateName = `${candidateName} ${continuation}`;
          }
        }
      }

      if (isLikelyName(candidateName) && candidateName.length >= 3) return candidateName;
    }
    return '';
  };

  const candidates = [name, fallbackName, findNameInLines(), extractNameFromTableFormat()];
  const finalName = candidates.find(isLikelyName) || '';

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

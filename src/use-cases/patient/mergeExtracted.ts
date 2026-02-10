import { normalizeExtractedPatientData } from '@domain/patient/patientTextExtraction';
import type { ExtractedPatientData } from '@shared/types';

const hasValue = (value?: string) => Boolean(value && value.trim().length > 0);

const choose = (base?: string, incoming?: string) => (hasValue(base) ? base : incoming || '');

export const mergeExtractedFields = (
  base: Partial<ExtractedPatientData>,
  incoming: Partial<ExtractedPatientData>
): Partial<ExtractedPatientData> => {
  const normalizedBase = normalizeExtractedPatientData(base);
  const normalizedIncoming = normalizeExtractedPatientData(incoming);

  return {
    name: choose(normalizedBase.name, normalizedIncoming.name),
    rut: choose(normalizedBase.rut, normalizedIncoming.rut),
    birthDate: choose(normalizedBase.birthDate, normalizedIncoming.birthDate),
    gender: choose(normalizedBase.gender, normalizedIncoming.gender),
    diagnosis: choose(normalizedBase.diagnosis, normalizedIncoming.diagnosis),
    clinicalNote: choose(normalizedBase.clinicalNote, normalizedIncoming.clinicalNote),
  };
};

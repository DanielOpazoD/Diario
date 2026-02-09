import type { ExtractedPatientData } from '@shared/types';

const FIELD_LABELS: Record<keyof ExtractedPatientData, string> = {
  name: 'Nombre',
  rut: 'RUT',
  birthDate: 'Nacimiento',
  gender: 'Género',
  diagnosis: 'Diagnóstico',
  clinicalNote: 'Nota',
};

export const diffExtractedFields = (
  current: ExtractedPatientData,
  extracted: Partial<ExtractedPatientData>
) => {
  const updates: Partial<ExtractedPatientData> = {};
  const labels: string[] = [];

  (Object.keys(FIELD_LABELS) as Array<keyof ExtractedPatientData>).forEach((key) => {
    const nextValue = extracted[key];
    if (nextValue && nextValue !== current[key]) {
      updates[key] = nextValue;
      labels.push(FIELD_LABELS[key]);
    }
  });

  return { updates, labels };
};

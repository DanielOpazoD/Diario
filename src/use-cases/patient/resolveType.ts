import type { PatientTypeConfig } from '@shared/types';
import { normalizePatientTypeLabel } from '@shared/utils/patientUtils';

export const resolvePatientType = (patientTypes: PatientTypeConfig[], typeId: string, fallbackLabel: string) => {
  const selectedType = patientTypes.find(t => t.id === typeId);
  return {
    type: normalizePatientTypeLabel(selectedType?.label || fallbackLabel),
    typeId: selectedType?.id || typeId,
  };
};

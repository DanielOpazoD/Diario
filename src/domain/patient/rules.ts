import type { ExtractedPatientData } from '@shared/types';
import { formatPatientName, normalizePatientTypeLabel as normalizeTypeLabel } from '@shared/utils/patientUtils';

export const isPatientNameValid = (name: string) => Boolean(name && name.trim().length > 0);

export const hasClinicalNote = (note: string) => Boolean(note && note.trim().length > 0);

export const isMissingCoreExtractedFields = (data: Partial<ExtractedPatientData>) => (
  !data.name || !data.rut || !data.birthDate || !data.gender
);

export const normalizePatientName = (name: string) => formatPatientName(name);
export const normalizePatientTypeLabel = (type: string) => normalizeTypeLabel(type);

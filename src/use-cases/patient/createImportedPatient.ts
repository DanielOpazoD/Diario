import { format } from 'date-fns';
import { inferPatientTypeId } from '@shared/utils/patientUtils';
import { PatientRecord, PatientType, ExtractedPatientData } from '@shared/types';
import { sanitizePatientFields } from '@use-cases/patient/sanitizeFields';
import { normalizeBirthDate } from '@domain/patient/dates';

interface CreateImportedPatientParams {
  id: string;
  extractedData: Partial<ExtractedPatientData>;
  currentDate: Date;
  timestamp: number;
}

export const createImportedPatientRecord = ({
  id,
  extractedData,
  currentDate,
  timestamp,
}: CreateImportedPatientParams): PatientRecord => {
  const sanitized = sanitizePatientFields({
    name: extractedData.name || '',
    rut: extractedData.rut || '',
    diagnosis: extractedData.diagnosis || '',
    clinicalNote: extractedData.clinicalNote || '',
  });

  const type = PatientType.POLICLINICO;

  return {
    id,
    name: sanitized.name || 'Paciente Nuevo',
    rut: sanitized.rut,
    birthDate: normalizeBirthDate(extractedData.birthDate || ''),
    gender: extractedData.gender?.trim() || '',
    type,
    typeId: inferPatientTypeId(type),
    diagnosis: sanitized.diagnosis || 'Importado desde PDF',
    clinicalNote: sanitized.clinicalNote,
    date: format(currentDate, 'yyyy-MM-dd'),
    attachedFiles: [],
    pendingTasks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

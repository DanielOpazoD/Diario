import { format } from 'date-fns';
import { formatPatientName } from '@shared/utils/patientUtils';
import { PatientRecord, PatientType, ExtractedPatientData } from '@shared/types';

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
}: CreateImportedPatientParams): PatientRecord => ({
  id,
  name: extractedData.name ? formatPatientName(extractedData.name) : 'Paciente Nuevo',
  rut: extractedData.rut || '',
  birthDate: extractedData.birthDate || '',
  gender: extractedData.gender || '',
  type: PatientType.POLICLINICO,
  diagnosis: extractedData.diagnosis && extractedData.diagnosis.trim() ? extractedData.diagnosis : 'Importado desde PDF',
  clinicalNote: extractedData.clinicalNote || '',
  date: format(currentDate, 'yyyy-MM-dd'),
  attachedFiles: [],
  pendingTasks: [],
  createdAt: timestamp,
  updatedAt: timestamp,
});

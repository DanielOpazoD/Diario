import { AttachedFile, PatientRecord, PatientTypeConfig, PendingTask } from '@shared/types';
import { sanitizePatientFields } from '@use-cases/patient/sanitizeFields';
import { resolvePatientType } from '@use-cases/patient/resolveType';

interface BuildInlineUpdateParams {
  patient: PatientRecord;
  patientTypes: PatientTypeConfig[];
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
  type: string;
  typeId: string;
  entryTime: string;
  exitTime: string;
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  attachedFiles: AttachedFile[];
  driveFolderId: string | null;
}

export const buildInlineUpdatedPatient = ({
  patient,
  patientTypes,
  name,
  rut,
  birthDate,
  gender,
  type,
  typeId,
  entryTime,
  exitTime,
  diagnosis,
  clinicalNote,
  pendingTasks,
  attachedFiles,
  driveFolderId,
}: BuildInlineUpdateParams): PatientRecord => {
  const sanitized = sanitizePatientFields({ name, rut, diagnosis, clinicalNote });
  const resolvedType = resolvePatientType(patientTypes, typeId, type);

  return {
    ...patient,
    name: sanitized.name,
    rut: sanitized.rut,
    birthDate,
    gender,
    type: resolvedType.type,
    typeId: resolvedType.typeId,
    entryTime: entryTime || undefined,
    exitTime: exitTime || undefined,
    diagnosis: sanitized.diagnosis,
    clinicalNote: sanitized.clinicalNote,
    pendingTasks,
    attachedFiles,
    driveFolderId,
  };
};

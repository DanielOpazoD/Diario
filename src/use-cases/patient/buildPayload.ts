import { AttachedFile, PatientCreateInput, PatientRecord, PatientTypeConfig, PatientUpdateInput, PendingTask } from '@shared/types';
import { sanitizePatientFields } from '@use-cases/patient/sanitizeFields';
import { resolvePatientType } from '@use-cases/patient/resolveType';
import { normalizeAttachedFiles, normalizePendingTasks } from '@use-cases/patient/normalizeCollections';

interface BuildPatientPayloadParams {
  initialData?: PatientRecord | null;
  selectedDate: string;
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
  patientId: string;
  driveFolderId: string | null;
}

export const buildPatientPayload = ({
  initialData,
  selectedDate,
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
  patientId,
  driveFolderId,
}: BuildPatientPayloadParams): PatientCreateInput | PatientUpdateInput => {
  const sanitized = sanitizePatientFields({ name, rut, diagnosis, clinicalNote });
  const resolvedType = resolvePatientType(patientTypes, typeId, type);
  const normalizedTasks = normalizePendingTasks(pendingTasks);
  const normalizedAttachedFiles = normalizeAttachedFiles(attachedFiles);

  const basePayload = {
    ...(initialData || {}),
    ...(initialData ? {} : { id: patientId }),
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
    pendingTasks: normalizedTasks,
    attachedFiles: normalizedAttachedFiles,
    driveFolderId,
    date: initialData ? initialData.date : selectedDate,
  };

  if (initialData) {
    return basePayload as PatientUpdateInput;
  }

  return basePayload as PatientCreateInput;
};

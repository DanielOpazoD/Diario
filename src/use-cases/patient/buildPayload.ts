import { AttachedFile, PatientCreateInput, PatientRecord, PatientTypeConfig, PatientUpdateInput, PendingTask } from '@shared/types';
import { sanitizePatientFields } from '@use-cases/patient/sanitizeFields';
import { resolvePatientType } from '@use-cases/patient/resolveType';

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

const normalizePendingTasks = (tasks: PendingTask[]): PendingTask[] =>
  (tasks ?? []).reduce<PendingTask[]>((acc, task, index) => {
    if (!task || typeof task.text !== 'string') return acc;
    const text = task.text.trim();
    if (!text) return acc;

    acc.push({
      ...task,
      id: task.id || `task-${index}`,
      text,
      completionNote: task.completionNote?.trim() || undefined,
    });
    return acc;
  }, []);

const normalizeAttachedFiles = (files: AttachedFile[]): AttachedFile[] =>
  (files ?? []).filter((file): file is AttachedFile =>
    Boolean(
      file &&
      typeof file.id === 'string' &&
      file.id.trim().length > 0 &&
      typeof file.name === 'string' &&
      file.name.trim().length > 0
    )
  );

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

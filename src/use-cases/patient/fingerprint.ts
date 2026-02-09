import type { PatientCreateInput, PatientUpdateInput } from '@shared/types';

export const patientPayloadFingerprint = (
  payload: PatientCreateInput | PatientUpdateInput,
  fallbackId?: string,
) => {
  const id = 'id' in payload ? payload.id : fallbackId;
  return JSON.stringify({
    id,
    name: payload.name,
    rut: payload.rut,
    birthDate: payload.birthDate,
    gender: payload.gender,
    type: payload.type,
    typeId: payload.typeId,
    entryTime: payload.entryTime ?? null,
    exitTime: payload.exitTime ?? null,
    diagnosis: payload.diagnosis,
    clinicalNote: payload.clinicalNote,
    pendingTasks: payload.pendingTasks,
    attachedFiles: payload.attachedFiles,
    driveFolderId: payload.driveFolderId ?? null,
    date: payload.date,
  });
};

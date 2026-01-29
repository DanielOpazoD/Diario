import { GeneralTask, PatientRecord } from '@shared/types';
import { buildGeneralTask, togglePatientPendingTask } from '@domain/tasks';

export const togglePatientTask = (
  records: PatientRecord[],
  patientId: string,
  taskId: string
): PatientRecord | null => {
  const patient = records.find((p) => p.id === patientId);
  if (!patient) return null;
  return togglePatientPendingTask(patient, taskId);
};

export const createGeneralTask = (text: string): GeneralTask | null => {
  if (!text.trim()) return null;
  return buildGeneralTask(text);
};

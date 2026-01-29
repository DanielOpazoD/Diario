import { GeneralTask, PatientRecord } from '@shared/types';

export const togglePatientPendingTask = (
  patient: PatientRecord,
  taskId: string
): PatientRecord => ({
  ...patient,
  pendingTasks: patient.pendingTasks.map((task) =>
    task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
  ),
});

export const buildGeneralTask = (text: string): GeneralTask => ({
  id: crypto.randomUUID(),
  text: text.trim(),
  isCompleted: false,
  createdAt: Date.now(),
  priority: 'medium',
});

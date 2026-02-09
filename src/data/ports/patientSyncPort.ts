import type { PatientRecord } from '@shared/types';

export interface PatientSyncPort {
  subscribeToPatients: (callback: (patients: PatientRecord[]) => void) => () => void;
  addPendingDeletion: (patientId: string) => void;
  deletePatient: (patientId: string) => Promise<void>;
  syncPatients: (patients: PatientRecord[]) => Promise<void>;
}

import type { PatientRecord } from '@shared/types';

export interface PatientSyncPort {
  subscribeToPatients: (callback: (patients: PatientRecord[]) => void) => () => void;
}

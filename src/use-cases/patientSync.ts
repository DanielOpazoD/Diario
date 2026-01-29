import { PatientRecord } from '@shared/types';
import { firebasePatientSyncAdapter } from '@data/adapters/firebasePatientSyncAdapter';

export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) =>
  firebasePatientSyncAdapter.subscribeToPatients(callback);

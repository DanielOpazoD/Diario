import type { PatientSyncPort } from '@data/ports/patientSyncPort';
import { subscribeToPatients } from '@services/firebaseService';

export const firebasePatientSyncAdapter: PatientSyncPort = {
  subscribeToPatients,
};

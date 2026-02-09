import type { PatientSyncPort } from '@data/ports/patientSyncPort';
import {
  addPendingDeletion,
  deletePatientFromFirebase,
  subscribeToPatients,
  syncPatientsToFirebase,
} from '@services/firebaseService';

export const firebasePatientSyncAdapter: PatientSyncPort = {
  subscribeToPatients,
  addPendingDeletion,
  deletePatient: deletePatientFromFirebase,
  syncPatients: syncPatientsToFirebase,
};

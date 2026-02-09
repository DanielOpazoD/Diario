import { firebasePatientSyncAdapter } from '@data/adapters/firebasePatientSyncAdapter';

export const deletePatientWithSync = async (patientId: string) => {
  firebasePatientSyncAdapter.addPendingDeletion(patientId);
  await firebasePatientSyncAdapter.deletePatient(patientId);
};

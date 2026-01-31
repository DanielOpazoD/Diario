import { addPendingDeletion, deletePatientFromFirebase } from '@services/firebaseService';

export const deletePatientWithSync = async (patientId: string) => {
  addPendingDeletion(patientId);
  await deletePatientFromFirebase(patientId);
};

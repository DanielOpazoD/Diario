import { StateCreator } from 'zustand';
import { PatientRecord } from '@shared/types';
import { deletePatientFromFirebase, addPendingDeletion, removePendingDeletion } from '@services/firebaseService';

export interface PatientSlice {
  records: PatientRecord[];
  setRecords: (records: PatientRecord[]) => void;
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  deletePatient: (id: string) => void;
}

export const createPatientSlice: StateCreator<PatientSlice> = (set) => ({
  records: [],
  setRecords: (records) => set({ records }),
  addPatient: (patient) => set((state) => ({ records: [...state.records, patient] })),
  updatePatient: (patient) => set((state) => ({
    records: state.records.map((p) => (p.id === patient.id ? patient : p)),
  })),
  deletePatient: (id) => {
    // Mark as pending deletion to prevent Firebase listener from re-adding it
    addPendingDeletion(id);

    // Remove from local state immediately
    set((state) => ({
      records: state.records.filter((p) => p.id !== id),
    }));

    // Delete from Firebase, then clear pending status
    deletePatientFromFirebase(id).finally(() => {
      // After Firebase confirms deletion (or fails), remove from pending set
      // Use a delay to ensure the onSnapshot has received the deletion
      setTimeout(() => removePendingDeletion(id), 2000);
    });
  },
});

import { StateCreator } from 'zustand';
import { PatientRecord } from '@shared/types';
import { deletePatientFromFirebase, addPendingDeletion } from '@services/firebaseService';

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
  addPatient: (patient) => set((state) => ({ records: [...state.records, { ...patient, updatedAt: Date.now() }] })),
  updatePatient: (patient) => set((state) => ({
    records: state.records.map((p) => (p.id === patient.id ? { ...patient, updatedAt: Date.now() } : p)),
  })),
  deletePatient: (id) => {
    // 1. Mark as pending deletion to prevent Firebase listener from re-adding it
    addPendingDeletion(id);

    // 2. Remove from local state immediately
    set((state) => ({
      records: state.records.filter((p) => p.id !== id),
    }));

    // 3. Delete from Firebase
    // We don't strictly need the finally/removePendingDeletion here anymore 
    // because isPendingDeletion handles expiry after 10s, but we can clear it 
    // explicitly once confirmed for extra cleanliness.
    deletePatientFromFirebase(id).finally(() => {
      // Optional: early cleanup if confirmed, but 10s grace period is safer
      // removePendingDeletion(id);
    });
  },
});

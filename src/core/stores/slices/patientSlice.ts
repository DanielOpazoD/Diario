import { StateCreator } from 'zustand';
import { PatientRecord } from '@shared/types';
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
  deletePatient: (id) => set((state) => ({
    records: state.records.filter((p) => p.id !== id),
  })),
});

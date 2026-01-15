import { StateCreator } from 'zustand';
import { PatientRecord } from '../../types';

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
  deletePatient: (id) => set((state) => ({
    records: state.records.filter((p) => p.id !== id),
  })),
});

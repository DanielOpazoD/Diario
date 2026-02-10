import { StateCreator } from 'zustand';
import { PatientRecord } from '@shared/types';
import {
  addPatientRecord,
  deletePatientRecord,
  setPatientRecords,
  updatePatientRecord,
} from '@use-cases/patient/records';

export interface PatientSlice {
  records: PatientRecord[];
  setRecords: (records: PatientRecord[]) => void;
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  deletePatient: (id: string) => void;
}

export const createPatientSlice: StateCreator<PatientSlice> = (set) => ({
  records: [],
  setRecords: (records) => set({ records: setPatientRecords(records) }),
  addPatient: (patient) => set((state) => ({ records: addPatientRecord(state.records, patient) })),
  updatePatient: (patient) => set((state) => ({ records: updatePatientRecord(state.records, patient) })),
  deletePatient: (id) => set((state) => ({ records: deletePatientRecord(state.records, id) })),
});

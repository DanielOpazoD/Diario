import { StateCreator } from 'zustand';
import { PatientTypeConfig, PatientType } from '@shared/types';
import { PATIENT_TYPE_COLORS } from '@shared/constants';

export interface PatientTypesSlice {
  patientTypes: PatientTypeConfig[];
  addPatientType: (config: PatientTypeConfig) => void;
  removePatientType: (id: string) => void;
  setPatientTypes: (types: PatientTypeConfig[]) => void;
}

export const defaultPatientTypes: PatientTypeConfig[] = [
  { id: 'hospitalizado', label: PatientType.HOSPITALIZADO, colorClass: PATIENT_TYPE_COLORS[PatientType.HOSPITALIZADO], isDefault: true },
  { id: 'policlinico', label: PatientType.POLICLINICO, colorClass: PATIENT_TYPE_COLORS[PatientType.POLICLINICO], isDefault: true },
  { id: 'turno', label: PatientType.TURNO, colorClass: PATIENT_TYPE_COLORS[PatientType.TURNO], isDefault: true },
  { id: 'extra', label: PatientType.EXTRA, colorClass: PATIENT_TYPE_COLORS[PatientType.EXTRA], isDefault: true },
];

export const createPatientTypesSlice: StateCreator<PatientTypesSlice> = (set) => ({
  patientTypes: defaultPatientTypes,
  setPatientTypes: (types) => set({ patientTypes: types }),
  addPatientType: (config) => set((state) => ({
    patientTypes: [...state.patientTypes, config],
  })),
  removePatientType: (id) => set((state) => ({
    patientTypes: state.patientTypes.filter(t => t.id !== id),
  })),
});

import { StateCreator } from 'zustand';
import type { PatientTypeConfig } from '@shared/types';
import { defaultPatientTypes } from '@core/stores/slices/patientTypesSlice';
import { STORAGE_DEFAULTS } from '@shared/constants/storageDefaults';

export interface SettingsSlice {
  patientTypes: PatientTypeConfig[];
  addPatientType: (config: PatientTypeConfig) => void;
  removePatientType: (id: string) => void;
  setPatientTypes: (types: PatientTypeConfig[]) => void;
  securityPin: string | null;
  autoLockMinutes: number;
  setSecurityPin: (pin: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
  highlightPendingPatients: boolean;
  compactStats: boolean;
  setHighlightPendingPatients: (value: boolean) => void;
  setCompactStats: (value: boolean) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  patientTypes: defaultPatientTypes,
  setPatientTypes: (types) => set({ patientTypes: types }),
  addPatientType: (config) => set((state) => ({
    patientTypes: [...state.patientTypes, config],
  })),
  removePatientType: (id) => set((state) => ({
    patientTypes: state.patientTypes.filter(t => t.id !== id),
  })),
  securityPin: null,
  autoLockMinutes: 5,
  setSecurityPin: (pin) => set({ securityPin: pin }),
  setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
  highlightPendingPatients: STORAGE_DEFAULTS.HIGHLIGHT_PENDING_PATIENTS,
  compactStats: STORAGE_DEFAULTS.COMPACT_STATS,
  setHighlightPendingPatients: (value) => set({ highlightPendingPatients: value }),
  setCompactStats: (value) => set({ compactStats: value }),
});

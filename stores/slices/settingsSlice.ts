
import { StateCreator } from 'zustand';
import { PatientTypeConfig, PatientType } from '../../types';
import { PATIENT_TYPE_COLORS } from '../../constants';

export interface SettingsSlice {
  patientTypes: PatientTypeConfig[];
  addPatientType: (config: PatientTypeConfig) => void;
  removePatientType: (id: string) => void;
  setPatientTypes: (types: PatientTypeConfig[]) => void;
  securityPin: string | null;
  autoLockMinutes: number;
  masterPasswordHash: string | null;
  masterPasswordSalt: string | null;
  isMasterUnlocked: boolean;
  masterPasswordSession: string | null;
  setSecurityPin: (pin: string | null) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setMasterPassword: (hash: string, salt: string) => void;
  setMasterUnlocked: (value: boolean) => void;
  setMasterPasswordSession: (password: string | null) => void;
  highlightPendingPatients: boolean;
  compactStats: boolean;
  setHighlightPendingPatients: (value: boolean) => void;
  setCompactStats: (value: boolean) => void;
  showBookmarkBar: boolean;
  setShowBookmarkBar: (value: boolean) => void;
}

export const defaultPatientTypes: PatientTypeConfig[] = [
  { id: 'hospitalizado', label: PatientType.HOSPITALIZADO, colorClass: PATIENT_TYPE_COLORS[PatientType.HOSPITALIZADO], isDefault: true },
  { id: 'policlinico', label: PatientType.POLICLINICO, colorClass: PATIENT_TYPE_COLORS[PatientType.POLICLINICO], isDefault: true },
  { id: 'turno', label: PatientType.TURNO, colorClass: PATIENT_TYPE_COLORS[PatientType.TURNO], isDefault: true },
  { id: 'extra', label: PatientType.EXTRA, colorClass: PATIENT_TYPE_COLORS[PatientType.EXTRA], isDefault: true },
];

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  patientTypes: defaultPatientTypes,
  securityPin: null,
  autoLockMinutes: 5,
  masterPasswordHash: null,
  masterPasswordSalt: null,
  isMasterUnlocked: false,
  masterPasswordSession: null,
  highlightPendingPatients: true,
  compactStats: true,
  showBookmarkBar: false,
  setPatientTypes: (types) => set({ patientTypes: types }),
  addPatientType: (config) => set((state) => ({
    patientTypes: [...state.patientTypes, config]
  })),
  removePatientType: (id) => set((state) => ({
    patientTypes: state.patientTypes.filter(t => t.id !== id)
  })),
  setSecurityPin: (pin) => set({ securityPin: pin }),
  setAutoLockMinutes: (minutes) => set({ autoLockMinutes: minutes }),
  setMasterPassword: (hash, salt) => set({ masterPasswordHash: hash, masterPasswordSalt: salt }),
  setMasterUnlocked: (value) => set({ isMasterUnlocked: value }),
  setMasterPasswordSession: (password) => set({ masterPasswordSession: password }),
  setHighlightPendingPatients: (value) => set({ highlightPendingPatients: value }),
  setCompactStats: (value) => set({ compactStats: value }),
  setShowBookmarkBar: (value) => set({ showBookmarkBar: value }),
});

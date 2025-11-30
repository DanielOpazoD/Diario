import { PatientType } from './shared/types/index.ts';

export const APP_NAME = "MediDiario AI";

export const PATIENT_TYPE_COLORS = {
  [PatientType.HOSPITALIZADO]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  [PatientType.POLICLINICO]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [PatientType.EXTRA]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [PatientType.TURNO]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
};

export const MOCK_USER = {
  name: "Dr. Usuario Demo",
  email: "doctor@medidiario.app",
  avatar: "https://picsum.photos/200"
};
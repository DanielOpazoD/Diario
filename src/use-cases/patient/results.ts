import { PatientRecord } from '@shared/types';

export type SavePatientResult = {
  patient: PatientRecord;
  isUpdate: boolean;
  message: string;
};

export type BatchResult = {
  ok: boolean;
  message: string;
  level: 'success' | 'error' | 'info';
  records?: PatientRecord[];
};

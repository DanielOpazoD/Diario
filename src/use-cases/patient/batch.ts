import { PatientCreateInput, PatientRecord } from '@shared/types';
import { buildNewPatient } from '@domain/patient/builders';

export const savePatientsBatch = (patientsData: PatientCreateInput[]): PatientRecord[] =>
  patientsData.map((patient) => buildNewPatient(patient));

export const createPatientsBatch = savePatientsBatch;

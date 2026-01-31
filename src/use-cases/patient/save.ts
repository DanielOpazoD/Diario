import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import { buildNewPatient, buildUpdatedPatient } from '@domain/patient/builders';
import type { SavePatientResult } from './results';

export const savePatient = (
  patientData: PatientCreateInput | PatientUpdateInput,
  existing: PatientRecord | null
): SavePatientResult => {
  if (existing) {
    return {
      patient: buildUpdatedPatient(existing, patientData as PatientUpdateInput),
      isUpdate: true,
      message: 'Paciente actualizado',
    };
  }

  return {
    patient: buildNewPatient(patientData as PatientCreateInput),
    isUpdate: false,
    message: 'Nuevo paciente registrado',
  };
};

export const savePatientRecord = savePatient;

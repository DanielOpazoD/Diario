import { PatientCreateInput, PatientRecord, PatientUpdateInput } from '@shared/types';
import { formatToDisplayDate } from '@shared/utils/dateUtils';
import {
  buildNewPatient,
  buildUpdatedPatient,
  clonePatientForDate,
} from '@domain/patient';

type SavePatientResult = {
  patient: PatientRecord;
  isUpdate: boolean;
  message: string;
};

type BatchResult = {
  ok: boolean;
  message: string;
  level: 'success' | 'error' | 'info';
  records?: PatientRecord[];
};

const formatDateLabel = (dateStr: string) => formatToDisplayDate(dateStr) || dateStr;

export const savePatient = (
  patientData: PatientCreateInput | PatientUpdateInput,
  editingPatient: PatientRecord | null
): SavePatientResult => {
  if (editingPatient) {
    return {
      patient: buildUpdatedPatient(editingPatient, patientData as PatientUpdateInput),
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

export const savePatientsBatch = (patientsData: PatientCreateInput[]): PatientRecord[] =>
  patientsData.map((patient) => buildNewPatient(patient));

export const movePatientsToDate = (
  records: PatientRecord[],
  patientIds: string[],
  targetDate: string
): BatchResult => {
  if (!targetDate) {
    return {
      ok: false,
      level: 'error',
      message: 'Debes seleccionar una fecha destino.',
    };
  }

  const updatedRecords = records.map((record) =>
    patientIds.includes(record.id)
      ? { ...record, date: targetDate, updatedAt: Date.now() }
      : record
  );

  return {
    ok: true,
    level: 'success',
    records: updatedRecords,
    message: `Pacientes movidos al ${formatDateLabel(targetDate)}.`,
  };
};

export const copyPatientsToDate = (
  records: PatientRecord[],
  patientIds: string[],
  targetDate: string
): BatchResult => {
  if (!targetDate) {
    return {
      ok: false,
      level: 'error',
      message: 'Debes seleccionar una fecha destino.',
    };
  }

  const selectedPatients = records.filter((record) => patientIds.includes(record.id));

  if (selectedPatients.length === 0) {
    return {
      ok: false,
      level: 'info',
      message: 'No hay pacientes para copiar.',
    };
  }

  const timestamp = Date.now();
  const clonedPatients = selectedPatients.map((patient, index) =>
    clonePatientForDate(patient, targetDate, timestamp, index)
  );

  return {
    ok: true,
    level: 'success',
    records: [...records, ...clonedPatients],
    message: `${clonedPatients.length} pacientes copiados al ${formatDateLabel(targetDate)}.`,
  };
};

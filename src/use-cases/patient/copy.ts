import { PatientRecord } from '@shared/types';
import { formatToDisplayDate } from '@shared/utils/dateUtils';
import { clonePatientForDate } from '@domain/patient/builders';
import type { BatchResult } from './results';

const formatDateLabel = (dateStr: string) => formatToDisplayDate(dateStr) || dateStr;

export const copyPatients = (
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

export const copyPatientsToDate = copyPatients;

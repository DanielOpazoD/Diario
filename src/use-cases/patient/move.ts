import { PatientRecord } from '@shared/types';
import { formatToDisplayDate } from '@shared/utils/dateUtils';
import type { BatchResult } from './results';

const formatDateLabel = (dateStr: string) => formatToDisplayDate(dateStr) || dateStr;

export const movePatients = (
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

export const movePatientsToDate = movePatients;

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { PatientRecord } from '../../patients';

export const useDailyRecords = (records: PatientRecord[], currentDate: Date) => {
  return useMemo(
    () => records.filter(record => isSameDay(new Date(`${record.date}T00:00:00`), currentDate)),
    [records, currentDate]
  );
};

export default useDailyRecords;

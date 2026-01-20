import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { PatientRecord } from '@shared/types';

export const useDailyMetrics = (records: PatientRecord[], currentDate: Date) => {
  const dailyRecords = useMemo(
    () => records.filter((record) => isSameDay(new Date(`${record.date}T00:00:00`), currentDate)),
    [records, currentDate],
  );

  const pendingTasks = useMemo(
    () => dailyRecords.reduce((acc, record) => acc + (record.pendingTasks?.filter((task) => !task.isCompleted).length || 0), 0),
    [dailyRecords],
  );

  return { dailyRecords, pendingTasks };
};

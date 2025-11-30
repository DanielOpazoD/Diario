import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { PatientRecord, PatientType, PatientTypeConfig } from '../../../shared/types/index.ts';

interface UseDailyRecordsParams {
  records: PatientRecord[];
  currentDate: Date;
  patientTypes: PatientTypeConfig[];
  activeFilter: string;
}

export const useDailyRecords = ({
  records,
  currentDate,
  patientTypes,
  activeFilter,
}: UseDailyRecordsParams) => {
  const dailyRecords = useMemo(
    () => records.filter(record => isSameDay(new Date(record.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const orderedPatientTypes = useMemo(() => {
    const defaultOrder = [
      PatientType.HOSPITALIZADO,
      PatientType.POLICLINICO,
      PatientType.TURNO,
      PatientType.EXTRA,
    ];
    const mapped = new Map(patientTypes.map(type => [type.label, type]));
    const prioritized = defaultOrder
      .map(label => mapped.get(label))
      .filter(Boolean) as PatientTypeConfig[];
    const remaining = patientTypes.filter(type => !defaultOrder.includes(type.label as PatientType));
    return [...prioritized, ...remaining];
  }, [patientTypes]);

  const summaryStats = useMemo(
    () => orderedPatientTypes.map(type => ({
      id: type.id,
      label: type.label,
      count: dailyRecords.filter(record => record.type === type.label).length,
      color: type.colorClass,
    })),
    [dailyRecords, orderedPatientTypes]
  );

  const visibleRecords = useMemo(
    () => {
      if (activeFilter === 'all') return dailyRecords;
      return dailyRecords.filter(record => record.type === activeFilter);
    },
    [dailyRecords, activeFilter]
  );

  const pendingTasks = useMemo(
    () => dailyRecords.reduce((total, record) => total + (record.pendingTasks?.filter(task => !task.isCompleted).length || 0), 0),
    [dailyRecords]
  );

  return {
    dailyRecords,
    orderedPatientTypes,
    summaryStats,
    visibleRecords,
    pendingTasks,
  };
};

export default useDailyRecords;

import { useCallback, useMemo, useState } from 'react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';

interface PatientFilterResult {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  orderedPatientTypes: PatientTypeConfig[];
  summaryStats: Array<{ id: string; label: string; count: number; color: string }>;
  visibleRecords: PatientRecord[];
  recordMatchesType: (record: PatientRecord, config: PatientTypeConfig) => boolean;
}

const DEFAULT_TYPE_ORDER = ['hospitalizado', 'policlinico', 'turno', 'extra'];

export const usePatientFilter = (
  dailyRecords: PatientRecord[],
  patientTypes: PatientTypeConfig[],
): PatientFilterResult => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const orderedPatientTypes = useMemo(() => {
    const mapped = new Map(patientTypes.map((type) => [type.id, type]));
    const prioritized = DEFAULT_TYPE_ORDER.map((id) => mapped.get(id)).filter(Boolean) as PatientTypeConfig[];
    const remaining = patientTypes.filter((type) => !DEFAULT_TYPE_ORDER.includes(type.id));
    return [...prioritized, ...remaining];
  }, [patientTypes]);

  const recordMatchesType = useCallback((record: PatientRecord, config: PatientTypeConfig) => {
    if (record.typeId) return record.typeId === config.id;
    return record.type === config.label;
  }, []);

  const summaryStats = useMemo(
    () =>
      orderedPatientTypes.map((type) => ({
        id: type.id,
        label: type.label,
        count: dailyRecords.filter((record) => recordMatchesType(record, type)).length,
        color: type.colorClass || '',
      })),
    [dailyRecords, orderedPatientTypes, recordMatchesType],
  );

  const visibleRecords = useMemo(() => {
    if (activeFilter === 'all') return dailyRecords;
    const targetConfig = orderedPatientTypes.find((config) => config.id === activeFilter);
    if (!targetConfig) return [];
    return dailyRecords.filter((record) => recordMatchesType(record, targetConfig));
  }, [activeFilter, dailyRecords, orderedPatientTypes, recordMatchesType]);

  return {
    activeFilter,
    setActiveFilter,
    orderedPatientTypes,
    summaryStats,
    visibleRecords,
    recordMatchesType,
  };
};

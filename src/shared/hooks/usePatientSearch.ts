import { useMemo, useState } from 'react';
import type { PatientRecord } from '@shared/types';

export const usePatientSearch = (records: PatientRecord[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return [] as PatientRecord[];
    const lower = searchQuery.toLowerCase();
    return records
      .filter((record) =>
        record.name.toLowerCase().includes(lower) ||
        record.rut.includes(lower) ||
        record.diagnosis.toLowerCase().includes(lower)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredRecords,
  };
};

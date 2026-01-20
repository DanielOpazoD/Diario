import { useCallback, useMemo, useState } from 'react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';

export interface GroupedHistoryRecord {
  rut: string;
  name: string;
  records: PatientRecord[];
}

interface PatientHistoryFilters {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  groupedRecords: GroupedHistoryRecord[];
  filteredGroups: GroupedHistoryRecord[];
  getTypeClass: (type: string, typeId?: string) => string;
}

export const usePatientHistory = (
  records: PatientRecord[],
  patientTypes: PatientTypeConfig[],
): PatientHistoryFilters => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const groupedRecords = useMemo(() => {
    const map = new Map<string, PatientRecord[]>();

    records.forEach(record => {
      const existing = map.get(record.rut) || [];
      existing.push(record);
      map.set(record.rut, existing);
    });

    const groups: GroupedHistoryRecord[] = Array.from(map.entries()).map(([rut, patientRecords]) => {
      const sortedRecords = [...patientRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      return {
        rut,
        name: sortedRecords[0]?.name || 'Paciente sin nombre',
        records: sortedRecords,
      };
    });

    return groups;
  }, [records]);

  const getTypeClass = useCallback(
    (type: string, typeId?: string) => {
      const config = typeId ? patientTypes.find(t => t.id === typeId) : patientTypes.find(t => t.label === type);
      return config?.colorClass || 'bg-gray-100 text-gray-700 border-gray-200';
    },
    [patientTypes],
  );

  const filteredGroups = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    return groupedRecords
      .map(group => {
        const recordsByType = typeFilter === 'all'
          ? group.records
          : group.records.filter(record => {
              if (record.typeId) return record.typeId === typeFilter;
              const config = patientTypes.find(t => t.id === typeFilter);
              return record.type === config?.label;
            });

        return {
          ...group,
          records: recordsByType,
        };
      })
      .filter(group => group.records.length > 0)
      .filter(group => {
        if (!lowerQuery) return true;
        return group.name.toLowerCase().includes(lowerQuery) || group.rut.toLowerCase().includes(lowerQuery);
      })
      .sort((a, b) => new Date(b.records[0].date).getTime() - new Date(a.records[0].date).getTime());
  }, [groupedRecords, searchQuery, typeFilter, patientTypes]);

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    groupedRecords,
    filteredGroups,
    getTypeClass,
  };
};

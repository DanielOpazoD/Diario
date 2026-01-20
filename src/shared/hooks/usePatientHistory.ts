import { useCallback, useMemo, useState } from 'react';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
import { getYearMonth } from '@shared/utils/dateUtils';

export interface GroupedHistoryRecord {
  rut: string;
  name: string;
  records: PatientRecord[];
}

interface PatientHistoryFilters {
  // Filters
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;

  // Temporal Filters
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  availableYears: string[];
  availableMonths: string[]; // For selected year

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  totalPages: number;

  // Data
  filteredGroups: GroupedHistoryRecord[];
  allVisits: PatientRecord[];
  paginatedVisits: PatientRecord[];

  // Helpers
  getTypeClass: (type: string, typeId?: string) => string;
}

export const usePatientHistory = (
  records: PatientRecord[],
  patientTypes: PatientTypeConfig[],
): PatientHistoryFilters => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Temporal State
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // 1. Get unique years and months from data
  const { availableYears, yearMonthMap } = useMemo(() => {
    const years = new Set<string>();
    const ymMap = new Map<string, Set<string>>();

    records.forEach(r => {
      const { year, month } = getYearMonth(r.date);
      years.add(year);
      if (!ymMap.has(year)) ymMap.set(year, new Set());
      ymMap.get(year)?.add(month);
    });

    return {
      availableYears: Array.from(years).sort((a, b) => b.localeCompare(a)),
      yearMonthMap: ymMap
    };
  }, [records]);

  const availableMonths = useMemo(() => {
    const months = yearMonthMap.get(selectedYear);
    return months ? Array.from(months).sort((a, b) => b.localeCompare(a)) : [];
  }, [yearMonthMap, selectedYear]);

  // 2. All visits filtered by search/type/year/month
  const allVisits = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    return records
      .filter(record => {
        const { year, month } = getYearMonth(record.date);

        // Match temporal
        if (year !== selectedYear || month !== selectedMonth) return false;

        // Match type
        if (typeFilter !== 'all') {
          if (record.typeId) {
            if (record.typeId !== typeFilter) return false;
          } else {
            const config = patientTypes.find(t => t.id === typeFilter);
            if (record.type !== config?.label) return false;
          }
        }

        // Match search
        if (lowerQuery) {
          const nameMatch = record.name.toLowerCase().includes(lowerQuery);
          const rutMatch = record.rut.toLowerCase().includes(lowerQuery);
          const diagnosisMatch = record.diagnosis.toLowerCase().includes(lowerQuery);
          if (!nameMatch && !rutMatch && !diagnosisMatch) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedYear, selectedMonth, typeFilter, searchQuery, patientTypes]);

  // 3. Pagination
  const totalPages = Math.ceil(allVisits.length / pageSize);
  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allVisits.slice(start, start + pageSize);
  }, [allVisits, currentPage, pageSize]);

  // 4. Legacy compatibility: Filtered groups (by RUT) for original UI if needed
  const filteredGroups = useMemo(() => {
    const map = new Map<string, PatientRecord[]>();
    allVisits.forEach(r => {
      const existing = map.get(r.rut) || [];
      existing.push(r);
      map.set(r.rut, existing);
    });

    return Array.from(map.entries()).map(([rut, patientRecords]) => ({
      rut,
      name: patientRecords[0]?.name || 'Paciente',
      records: patientRecords,
    }));
  }, [allVisits]);

  const getTypeClass = useCallback(
    (type: string, typeId?: string) => {
      const config = typeId ? patientTypes.find(t => t.id === typeId) : patientTypes.find(t => t.label === type);
      return config?.colorClass || 'bg-gray-100 text-gray-700 border-gray-200';
    },
    [patientTypes],
  );

  return {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    availableYears,
    availableMonths,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    filteredGroups,
    allVisits,
    paginatedVisits,
    getTypeClass,
  };
};

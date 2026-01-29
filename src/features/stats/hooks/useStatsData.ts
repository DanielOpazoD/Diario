import { useCallback, useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, endOfMonth, format, isSameDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import { PatientRecord, PatientTypeConfig } from '@shared/types';

interface ChartTypeEntry {
  id: string;
  label: string;
}

interface DailyStatsRow {
  date: string;
  total: number;
  [key: string]: number | string;
}

interface TrendPoint {
  day: string;
  dateFull: string;
  count: number;
}

interface TypeDistributionEntry {
  name: string;
  value: number;
}

interface ReportData {
  count: number;
  hours: Record<string, string>;
}

interface StatsState {
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  totalRecords: number;
  chartTypes: ChartTypeEntry[];
  monthlyData: DailyStatsRow[];
  trendData: TrendPoint[];
  typeDistribution: TypeDistributionEntry[];
  monthTotal: number;
  reportData: ReportData;
  compactStats: boolean;
  resetToCurrentMonth: () => void;
  setLastSevenDays: () => void;
}

const matchesTypeId = (record: PatientRecord, typeId: string, typeConfigById: Record<string, PatientTypeConfig>) => {
  if (record.typeId) return record.typeId === typeId;
  const config = typeConfigById[typeId];
  return record.type === config?.label;
};

export const useStatsData = (currentDate: Date): StatsState => {
  const { records, patientTypes, compactStats } = useAppStore(useShallow(state => ({
    records: state.records,
    patientTypes: state.patientTypes,
    compactStats: state.compactStats,
  })));

  const typeConfigByLabel = useMemo(() => {
    return patientTypes.reduce<Record<string, PatientTypeConfig>>((acc, type) => {
      acc[type.label.toLowerCase()] = type;
      return acc;
    }, {});
  }, [patientTypes]);

  const typeConfigById = useMemo(() => {
    return patientTypes.reduce<Record<string, PatientTypeConfig>>((acc, type) => {
      acc[type.id] = type;
      return acc;
    }, {});
  }, [patientTypes]);

  const relevantTypes = useMemo(() => patientTypes.map(t => t.id), [patientTypes]);

  const chartTypes = useMemo(
    () =>
      relevantTypes.map(id => ({
        id,
        label: typeConfigById[id]?.label || id,
      })),
    [relevantTypes, typeConfigById],
  );

  const [startDate, setStartDate] = useState(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
  const totalRecords = records.length;

  const monthlyData = useMemo<DailyStatsRow[]>(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayRecords = records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), day));

      const dayStats: DailyStatsRow = {
        date: format(day, 'd', { locale: es }),
        total: dayRecords.length,
      };

      chartTypes.forEach(({ id, label }) => {
        dayStats[label] = dayRecords.filter(r => matchesTypeId(r, id, typeConfigById)).length;
      });

      return dayStats;
    });
  }, [records, currentDate, chartTypes, typeConfigById]);

  const trendData = useMemo<TrendPoint[]>(() => {
    const end = new Date();
    const start = addDays(end, -6);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const count = records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), day)).length;
      return {
        day: format(day, 'EEE', { locale: es }),
        dateFull: format(day, 'd MMM'),
        count,
      };
    });
  }, [records]);

  const typeDistribution = useMemo<TypeDistributionEntry[]>(() => {
    const monthRecords = records.filter(r => {
      const d = new Date(r.date + 'T00:00:00');
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    return relevantTypes
      .map(typeId => {
        const label = typeConfigById[typeId]?.label || typeId;
        return {
          name: label,
          value: monthRecords.filter(r => matchesTypeId(r, typeId, typeConfigById)).length,
        };
      })
      .filter(d => d.value > 0);
  }, [records, currentDate, relevantTypes, typeConfigById]);

  const monthTotal = useMemo(
    () => typeDistribution.reduce((acc, curr) => acc + curr.value, 0),
    [typeDistribution],
  );

  const reportData = useMemo<ReportData>(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    const rangeRecords = records.filter(r => {
      const rDate = new Date(r.date + 'T00:00:00');
      return isWithinInterval(rDate, { start, end });
    });

    const hoursByType: Record<string, number> = {};
    const trackedTypes = relevantTypes.filter(t => typeConfigById[t]?.id !== 'extra');

    trackedTypes.forEach(t => {
      const label = typeConfigById[t]?.label || t;
      hoursByType[label] = 0;
    });

    rangeRecords.forEach(r => {
      const config = r.typeId ? typeConfigById[r.typeId] : typeConfigByLabel[r.type.toLowerCase()];

      if (config?.id === 'extra') return;

      if (config?.id === 'policlinico') {
        hoursByType[config.label] += 30;
      } else if (config?.id === 'turno') {
        if (r.entryTime && r.exitTime) {
          const [startH, startM] = r.entryTime.split(':').map(Number);
          const [endH, endM] = r.exitTime.split(':').map(Number);
          let diffMins = endH * 60 + endM - (startH * 60 + startM);
          if (diffMins < 0) diffMins += 24 * 60;
          hoursByType[config.label] += diffMins;
        }
      }
    });

    const formattedHours: Record<string, string> = {};
    Object.keys(hoursByType).forEach(key => {
      const config = typeConfigByLabel[key.toLowerCase()] || typeConfigById[key];
      if (config?.id !== 'hospitalizado' && config?.id !== 'extra') {
        formattedHours[key] = (hoursByType[key] / 60).toFixed(1);
      }
    });

    return {
      count: rangeRecords.length,
      hours: formattedHours,
    };
  }, [records, startDate, endDate, relevantTypes, typeConfigById, typeConfigByLabel]);

  const resetToCurrentMonth = useCallback(() => {
    setStartDate(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(currentDate), 'yyyy-MM-dd'));
  }, [currentDate]);

  const setLastSevenDays = useCallback(() => {
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setStartDate(format(addDays(new Date(), -6), 'yyyy-MM-dd'));
  }, []);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    chartTypes,
    monthlyData,
    trendData,
    typeDistribution,
    monthTotal,
    reportData,
    compactStats,
    resetToCurrentMonth,
    setLastSevenDays,
    totalRecords,
  };
};

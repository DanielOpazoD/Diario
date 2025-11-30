import React from 'react';
import FilterBar from '../../../components/FilterBar';

interface DailyFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  summaryStats: Array<{
    id: string;
    label: string;
    count: number;
    color: string;
  }>;
  totalCount: number;
}

const DailyFilters: React.FC<DailyFiltersProps> = ({
  activeFilter,
  onFilterChange,
  summaryStats,
  totalCount,
}) => {
  return (
    <FilterBar
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      stats={summaryStats}
      totalCount={totalCount}
    />
  );
};

export default DailyFilters;

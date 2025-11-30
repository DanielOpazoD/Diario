import React from 'react';

interface FilterStat {
  id: string;
  label: string;
  count: number;
  color: string;
}

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  stats: FilterStat[];
  totalCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange, stats, totalCount }) => {
  return (
    <div
      className="bg-gray-100/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-1 flex overflow-x-auto no-scrollbar gap-1"
      role="group"
      aria-label="Filtros de pacientes"
    >
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        aria-pressed={activeFilter === 'all'}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-offset-gray-900 ${
          activeFilter === 'all'
            ? 'bg-gray-900 text-white border-gray-800 shadow-sm dark:bg-white dark:text-gray-900'
            : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:border-gray-300 dark:bg-gray-900/80 dark:text-gray-200 dark:border-gray-700'
        }`}
      >
        Todos
        <span className="inline-flex items-center justify-center min-w-[1.5rem] text-[11px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-medium">
          {totalCount}
        </span>
      </button>
      {stats.map(stat => (
        <button
          type="button"
          key={stat.id}
          onClick={() => onFilterChange(stat.label)}
          aria-pressed={activeFilter === stat.label}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors border whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-offset-gray-900 ${
            activeFilter === stat.label
              ? `bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50 border-gray-200 dark:border-gray-700 shadow-sm ${stat.color.split(' ')[0].replace('bg-', 'ring-').replace('100', '400')} ring-1`
              : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:border-gray-300 dark:bg-gray-900/80 dark:text-gray-200 dark:border-gray-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${stat.color.split(' ')[0].replace('100', '500')}`}></span>
          {stat.label}
          <span className="inline-flex items-center justify-center min-w-[1.5rem] text-[11px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-medium">
            {stat.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;

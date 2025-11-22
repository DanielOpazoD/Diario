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
      className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md py-1.5 mb-1.5 -mx-4 px-4 md:mx-0 md:px-0"
      role="group"
      aria-label="Filtros de pacientes"
    >
      <div className="flex overflow-x-auto no-scrollbar pb-1 gap-1.5 items-center" role="list">
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          aria-pressed={activeFilter === 'all'}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-bold uppercase tracking-wide transition-colors border shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-offset-gray-900 ${
            activeFilter === 'all'
              ? 'bg-gray-900 text-white border-gray-800 dark:bg-white dark:text-gray-900'
              : 'bg-white/90 dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          Todos <span className="opacity-70 ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{totalCount}</span>
        </button>
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
        {stats.map(stat => (
          <button
            type="button"
            key={stat.id}
            onClick={() => onFilterChange(stat.label)}
            aria-pressed={activeFilter === stat.label}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[11px] font-bold uppercase tracking-wide transition-colors border whitespace-nowrap shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-offset-gray-900 ${
              activeFilter === stat.label
                ? `bg-white dark:bg-gray-800 ring-1 ring-offset-1 dark:ring-offset-gray-900 ring-opacity-60 ${stat.color.replace('bg-', 'ring-').split(' ')[0]}`
                : 'bg-white/80 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 opacity-80 hover:opacity-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${stat.color.split(' ')[0].replace('100', '500')}`}></span>
            {stat.label} <span className="opacity-60 ml-1">{stat.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterBar;

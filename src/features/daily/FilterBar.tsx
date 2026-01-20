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
      className="flex overflow-x-auto no-scrollbar gap-1"
      role="group"
      aria-label="Filtros de pacientes"
    >
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        aria-pressed={activeFilter === 'all'}
        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${activeFilter === 'all'
            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
          }`}
      >
        Todos
        <span className="text-[10px] opacity-70">{totalCount}</span>
      </button>
      {stats.map(stat => (
        <button
          type="button"
          key={stat.id}
          onClick={() => onFilterChange(stat.id)}
          aria-pressed={activeFilter === stat.id}
          className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${activeFilter === stat.id
              ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800'
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${stat.color.split(' ')[0].replace('100', '500')}`}></span>
          {stat.label}
          <span className="text-[10px] opacity-70">{stat.count}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;

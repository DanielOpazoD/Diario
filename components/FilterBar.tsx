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
    <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-md pt-1 pb-3 mb-2 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex overflow-x-auto no-scrollbar pb-1 gap-2 items-center">
        <button
          onClick={() => onFilterChange('all')}
          className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border ${activeFilter === 'all' ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900 shadow-md scale-105' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
        >
          Todos <span className="opacity-60 ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{totalCount}</span>
        </button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0"></div>
        {stats.map(stat => (
          <button
            key={stat.id}
            onClick={() => onFilterChange(stat.label)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border whitespace-nowrap ${
              activeFilter === stat.label
                ? `bg-white dark:bg-gray-800 ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-opacity-50 shadow-md scale-105 ${stat.color.replace('bg-', 'ring-').split(' ')[0]}`
                : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
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

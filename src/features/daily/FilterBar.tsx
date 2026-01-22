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
      className="flex overflow-x-auto no-scrollbar gap-2 py-0.5"
      role="group"
      aria-label="Filtros de pacientes"
    >
      <button
        type="button"
        onClick={() => onFilterChange('all')}
        aria-pressed={activeFilter === 'all'}
        className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-pill text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${activeFilter === 'all'
          ? 'bg-brand-500 text-white border-brand-400 shadow-premium group-hover:shadow-brand-500/30'
          : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border-gray-100 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:text-brand-500'
          }`}
      >
        <span>Todos</span>
        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>{totalCount}</span>
      </button>
      {stats.map(stat => (
        <button
          type="button"
          key={stat.id}
          onClick={() => onFilterChange(stat.id)}
          aria-pressed={activeFilter === stat.id}
          className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-pill text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${activeFilter === stat.id
            ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-700 dark:border-gray-200 shadow-premium'
            : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 border-gray-100 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:text-brand-500'
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_rgba(var(--brand-500-rgb),0.5)] ${stat.color.split(' ')[0].replace('100', '500')}`}></span>
          <span>{stat.label}</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeFilter === stat.id ? 'bg-white/20 dark:bg-black/10 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>{stat.count}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;

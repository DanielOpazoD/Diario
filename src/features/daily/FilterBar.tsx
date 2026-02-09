import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter } from 'lucide-react';

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
  const options = useMemo(() => ([
    { id: 'all', label: 'Todos', count: totalCount },
    ...stats.map((stat) => ({
      id: stat.id,
      label: stat.label,
      count: stat.count,
    })),
  ]), [stats, totalCount]);
  const activeOption = useMemo(() => options.find((option) => option.id === activeFilter), [activeFilter, options]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCloseMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleCloseMenu, isOpen]);

  return (
    <div className="flex items-center gap-3 py-0.5" aria-label="Filtros de pacientes">
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-100"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span>{activeOption?.label ?? 'Todos'}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[9px] text-gray-500 dark:text-gray-200">
            {activeOption?.count ?? totalCount}
          </span>
          <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {isOpen && (
          <div className="absolute left-0 top-[110%] z-30 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-1 animate-fade-in">
            <div className="max-h-56 overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => {
                    onFilterChange(option.id);
                    handleCloseMenu();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                    option.id === activeFilter
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                    option.id === activeFilter ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {activeFilter !== 'all' && activeOption && (
        <button
          type="button"
          onClick={() => onFilterChange('all')}
          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest shadow-sm"
        >
          {activeOption.label}
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px]">{activeOption.count}</span>
          <span className="text-[10px]">×</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;

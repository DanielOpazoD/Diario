import React, { useEffect, useMemo, useRef, useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filters = useMemo(
    () => [{ id: 'all', label: 'Todos', count: totalCount, color: 'bg-brand-500 text-white' }, ...stats],
    [stats, totalCount],
  );

  const activeOption = useMemo(() => {
    if (activeFilter === 'all') {
      return { id: 'all', label: 'Todos', count: totalCount, color: 'bg-brand-500 text-white' };
    }
    return filters.find(option => option.id === activeFilter) ?? filters[0];
  }, [activeFilter, filters, totalCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mostrar</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-[11px] font-semibold uppercase tracking-wide shadow-sm hover:border-gray-300 hover:shadow-md transition"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${activeOption.id === 'all'
                ? 'bg-brand-500'
                : activeOption.color.split(' ')[0].replace('100', '500')
                }`}
            ></span>
            {activeOption.label}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-bold">
            {activeOption.count}
          </span>
          <span className="text-[10px] text-gray-400">▾</span>
        </button>

        {isOpen && (
          <div
            className="absolute left-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-1 z-50"
            role="menu"
          >
            {filters.map(option => (
              <button
                type="button"
                key={option.id}
                onClick={() => {
                  onFilterChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition ${activeFilter === option.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
                role="menuitem"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${option.id === 'all'
                      ? 'bg-brand-500'
                      : option.color.split(' ')[0].replace('100', '500')
                      }`}
                  ></span>
                  {option.label}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">{option.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

import React from 'react';
import { Button } from '@core/ui';
import FilterBar from '@features/daily/FilterBar';
import PdfImportEntry from '@features/daily/components/PdfImportEntry';

interface DailyHeaderProps {
    currentDate: Date;
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    summaryStats: any;
    dailyRecordsCount: number;
    pendingTasks: number;
    selectionMode: boolean;
    toggleSelectionMode: () => void;
    onAddBlankPatient: () => void;
}

const DailyHeader: React.FC<DailyHeaderProps> = ({
    currentDate,
    activeFilter,
    setActiveFilter,
    summaryStats,
    dailyRecordsCount,
    pendingTasks,
    selectionMode,
    toggleSelectionMode,
    onAddBlankPatient,
}) => {
    return (
        <div className="sticky top-1 z-20 mb-1.5 group">
            <div className="glass shadow-premium-lg rounded-panel px-3 py-1.5 transition-all duration-500 border-white/40 dark:border-white/10 group-hover:shadow-premium-xl group-hover:border-white/60">
                <div className="flex items-center justify-between gap-2">
                    {/* Filter Bar - Modern compact layout */}
                    <div className="flex-1 min-w-0">
                        <FilterBar
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                            stats={summaryStats}
                            totalCount={dailyRecordsCount}
                        />
                    </div>

                    {/* Action Buttons - Premium styling */}
                    <div className="flex gap-1.5 items-center shrink-0 pl-3 border-l border-gray-100 dark:border-gray-800/50">
                        {pendingTasks > 0 && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-pill bg-amber-500/10 text-amber-600 dark:text-amber-500 animate-pulse border border-amber-500/20">
                                <span className="text-[8px] font-black uppercase tracking-tighter">{pendingTasks}</span>
                                <span className="text-[9px]">⚡</span>
                            </div>
                        )}

                        <div className="flex items-center gap-0.5 p-0.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                            <Button
                                variant={selectionMode ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={toggleSelectionMode}
                                className={`min-w-[26px] h-6 rounded-lg !p-0 text-[11px] ${selectionMode ? 'bg-brand-500 shadow-brand-500/40' : 'text-gray-500'}`}
                            >
                                {selectionMode ? '✕' : '☐'}
                            </Button>

                            <PdfImportEntry currentDate={currentDate} />
                        </div>

                        <Button
                            onClick={onAddBlankPatient}
                            size="sm"
                            className="rounded-xl px-3 h-7 font-black bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/30 text-[10px] transition-all active:scale-95"
                        >
                            + NUEVO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyHeader;

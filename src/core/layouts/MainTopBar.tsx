import React from 'react';
import { Menu } from 'lucide-react';
import { DateNavigator } from '@features/daily';
import { PatientRecord, ViewMode } from '@shared/types';

interface MainTopBarProps {
  viewMode: ViewMode;
  currentDate: Date;
  records: PatientRecord[];
  onDateChange: (date: Date) => void;
  onOpenNewPatient: () => void;
  onOpenSidebar: () => void;
}

const MainTopBar: React.FC<MainTopBarProps> = ({
  viewMode,
  currentDate,
  records,
  onDateChange,
  onOpenNewPatient,
  onOpenSidebar,
}) => (
  <div
    className="sticky top-0 z-30 bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl shadow-sm border-b border-gray-200/60 dark:border-gray-800/60"
  >
    <header className="shrink-0 transition-all glass pt-1 pb-1 md:pt-2 md:pb-1.5">
      <div className="max-w-5xl mx-auto w-full px-3 md:px-5 flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-0">
        <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center">
            <button
              onClick={onOpenSidebar}
              className="md:hidden mr-3 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            {viewMode !== 'daily' && viewMode !== 'tasks' && (
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                {viewMode === 'stats' && 'Estadí­sticas'}
                {viewMode === 'bookmarks' && 'Marcadores'}
                {viewMode === 'settings' && 'Ajustes'}
                {viewMode === 'reports' && 'Informes Clínicos'}
              </h2>
            )}
          </div>

          {viewMode === 'daily' && (
            <button
              onClick={onOpenNewPatient}
              className="md:hidden ml-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
            >
              +
            </button>
          )}
        </div>

        {viewMode === 'daily' && (
          <div className="flex-1 w-full flex justify-center items-center">
            <DateNavigator currentDate={currentDate} onSelectDate={onDateChange} records={records} />
          </div>
        )}

        <div className="flex items-center gap-3 hidden md:flex" />
      </div>
    </header>
  </div>
);

export default MainTopBar;

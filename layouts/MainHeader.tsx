import React from 'react';
import { Menu } from 'lucide-react';
import DateNavigator from '../components/DateNavigator';
import { PatientRecord, ViewMode } from '../types';

interface MainHeaderProps {
  viewMode: ViewMode;
  currentDate: Date;
  records: PatientRecord[];
  onDateChange: (date: Date) => void;
  onOpenSidebar: () => void;
  onOpenNewPatient: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({
  viewMode,
  currentDate,
  records,
  onDateChange,
  onOpenSidebar,
  onOpenNewPatient,
}) => {
  return (
    <header className="shrink-0 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 transition-all glass pt-2 pb-2 md:pt-4 md:pb-3 gap-2 md:gap-0">
      <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center">
          <button
            onClick={onOpenSidebar}
            className="md:hidden mr-3 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          {viewMode !== 'daily' && (
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
              {viewMode === 'stats' && 'Estadísticas'}
              {viewMode === 'bookmarks' && 'Marcadores'}
              {viewMode === 'tasks' && 'Tareas'}
              {viewMode === 'settings' && 'Ajustes'}
            </h2>
          )}
        </div>

        {viewMode === 'daily' ? (
          <div className="flex-1 md:flex-none flex justify-center md:justify-start items-center gap-2">
            <DateNavigator currentDate={currentDate} onSelectDate={onDateChange} records={records} />
          </div>
        ) : null}

        {viewMode === 'daily' && (
          <button
            onClick={onOpenNewPatient}
            className="md:hidden ml-2 p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            +
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 hidden md:flex" />
    </header>
  );
};

export default MainHeader;

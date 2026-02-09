import React, { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { DateNavigator } from '@features/daily';
import { PatientRecord, ViewMode } from '@shared/types';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import { safeSessionGetItem } from '@shared/utils/safeSessionStorage';

interface MainTopBarProps {
  viewMode: ViewMode;
  currentDate: Date;
  records: PatientRecord[];
  onDateChange: (date: Date) => void;
  onOpenNewPatient: () => void;
  onOpenSidebar: () => void;
}

type ReportTopbarContext = {
  patientName?: string;
  patientRut?: string;
  reportDate?: string;
  templateName?: string;
};

const readReportContext = (): ReportTopbarContext | null => {
  const raw = safeSessionGetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReportTopbarContext | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_error) {
    return null;
  }
};

const MainTopBar: React.FC<MainTopBarProps> = ({
  viewMode,
  currentDate,
  records,
  onDateChange,
  onOpenNewPatient,
  onOpenSidebar,
}) => {
  const [reportContext, setReportContext] = useState<ReportTopbarContext | null>(null);

  useEffect(() => {
    if (viewMode !== 'reports') {
      setReportContext(null);
      return;
    }

    const refreshContext = (_event?: Event) => {
      setReportContext(readReportContext());
    };

    refreshContext();
    window.addEventListener('medidiario:report-context', refreshContext);
    window.addEventListener('focus', refreshContext);
    return () => {
      window.removeEventListener('medidiario:report-context', refreshContext);
      window.removeEventListener('focus', refreshContext);
    };
  }, [viewMode]);

  const reportSubtitle = useMemo(() => {
    if (!reportContext) return 'Edición de informe clínico';
    const parts = [reportContext.patientRut, reportContext.reportDate].filter(Boolean);
    if (parts.length > 0) return parts.join(' · ');
    return reportContext.templateName || 'Edición de informe clínico';
  }, [reportContext]);

  return (
    <div
      className={`sticky top-0 z-30 shadow-sm border-b border-gray-200/60 dark:border-gray-800/60 ${
        viewMode === 'reports'
          ? 'bg-white dark:bg-gray-950 backdrop-blur-none'
          : 'bg-white/85 dark:bg-gray-950/85 backdrop-blur-xl'
      }`}
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
            {viewMode !== 'daily' && viewMode !== 'tasks' && viewMode !== 'reports' && (
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                {viewMode === 'stats' && 'Estadísticas'}
                {viewMode === 'bookmarks' && 'Marcadores'}
                {viewMode === 'settings' && 'Ajustes'}
              </h2>
            )}
            {viewMode === 'reports' && (
              <div className="flex flex-col">
                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  {reportContext?.patientName || 'Informe clínico'}
                </h2>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                  {reportSubtitle}
                </p>
              </div>
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
};

export default MainTopBar;

import React, { useEffect, useMemo, useState } from 'react';
import { Menu } from 'lucide-react';
import { ViewMode } from '@shared/types';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import { safeSessionGetItem } from '@shared/utils/safeSessionStorage';

interface MainTopBarProps {
  viewMode: ViewMode;
  onOpenNewPatient: () => void;
  onOpenSidebar: () => void;
  dailyDateNavigator?: React.ReactNode;
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
  onOpenNewPatient,
  onOpenSidebar,
  dailyDateNavigator,
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
      className={`sticky top-0 z-30 transition-all duration-300 ${viewMode === 'reports'
        ? 'bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-white/5 shadow-premium-sm'
        : 'bg-white/70 dark:bg-gray-950/70 backdrop-blur-2xl border-b border-gray-200/40 dark:border-white/5 shadow-premium-sm'
        }`}
    >
      <header className="shrink-0 transition-all pt-1.5 pb-1.5 md:pt-3 md:pb-2.5">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center">
              <button
                onClick={onOpenSidebar}
                className="md:hidden mr-4 p-2.5 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-90"
              >
                <Menu className="w-6 h-6" />
              </button>
              {viewMode !== 'daily' && viewMode !== 'tasks' && viewMode !== 'reports' && (
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tightest truncate">
                  {viewMode === 'stats' && 'Análisis Estadístico'}
                  {viewMode === 'bookmarks' && 'Mis Marcadores'}
                  {viewMode === 'settings' && 'Ajustes del Sistema'}
                </h2>
              )}
              {viewMode === 'reports' && (
                <div className="flex flex-col">
                  <h2 className="text-lg md:text-xl font-extrabold text-gray-950 dark:text-white tracking-tightest truncate">
                    {reportContext?.patientName || 'Generador de Informe'}
                  </h2>
                  <p className="text-[11px] md:text-xs text-gray-400 dark:text-gray-500 truncate font-semibold uppercase tracking-wider">
                    {reportSubtitle}
                  </p>
                </div>
              )}
            </div>

            {viewMode === 'daily' && (
              <button
                onClick={onOpenNewPatient}
                className="md:hidden ml-3 px-4 py-2 bg-brand-600 text-white font-bold rounded-2xl shadow-premium hover:bg-brand-700 active:scale-95 transition-all"
              >
                + PACIENTE
              </button>
            )}
          </div>

          {viewMode === 'daily' && (
            <div className="flex-1 w-full flex justify-center items-center">
              {dailyDateNavigator}
            </div>
          )}

          <div className="flex items-center gap-3 hidden md:flex" />
        </div>
      </header>
    </div>
  );
};

export default MainTopBar;

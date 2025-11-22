import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BarChart2, Calendar as CalendarIcon, CheckSquare, Cloud, Download, LogOut, Menu, RefreshCw, Search, Settings as SettingsIcon, Upload, X } from 'lucide-react';
import DateNavigator from '../components/DateNavigator';
import Button from '../components/Button';
import { ViewMode, PatientRecord, User } from '../types';
import { downloadDataAsJson } from '../services/storage';

interface MainLayoutProps {
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User;
  currentDate: Date;
  records: PatientRecord[];
  onDateChange: (date: Date) => void;
  onOpenNewPatient: () => void;
  onGenerateReport: () => void;
  onOpenBackupModal: () => void;
  onOpenDrivePicker: () => void;
  onLogout: () => void;
  onLocalImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  viewMode,
  onNavigate,
  user,
  currentDate,
  records,
  onDateChange,
  onOpenNewPatient,
  onGenerateReport,
  onOpenBackupModal,
  onOpenDrivePicker,
  onLogout,
  onLocalImport,
  contentRef,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const localImportInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [viewMode, isMobile]);

  const handleTriggerLocalImport = () => {
    localImportInputRef.current?.click();
  };

  const handleNavigation = (view: ViewMode) => {
    onNavigate(view);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        key="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r-0 transform transition-all duration-300 ease-out flex flex-col h-full ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0 md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-lg md:h-screen md:z-40 md:border-r md:border-gray-200/60 md:dark:border-gray-800/60 md:shadow-sm flex-shrink-0`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <span className="text-lg">M</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">MediDiario</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="px-4 py-2 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 mt-2">Menu Principal</p>
          {[
            { id: 'daily', label: 'Agenda Diaria', icon: CalendarIcon },
            { id: 'tasks', label: 'Mis Tareas', icon: CheckSquare },
            { id: 'search', label: 'Buscador Global', icon: Search },
            { id: 'stats', label: 'Estadísticas', icon: BarChart2 }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id as ViewMode)}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                viewMode === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:translate-x-1'
              }`}
            >
              <item.icon
                className={`w-5 h-5 mr-3 transition-colors ${
                  viewMode === item.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`}
              />
              {item.label}
            </button>
          ))}

          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/30 mx-4"></div>
          <button
            onClick={() => handleNavigation('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
              viewMode === 'settings'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:translate-x-1'
            }`}
          >
            <SettingsIcon
              className={`w-5 h-5 mr-3 transition-colors ${
                viewMode === 'settings'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              }`}
            />
            Configuración
          </button>
        </nav>

        <div className="p-4 m-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/30 backdrop-blur-md">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold ring-2 ring-white dark:ring-gray-700 shadow-sm">
              {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate opacity-80">{user.email || 'Sin email'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={onOpenBackupModal}
              className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-md shadow-green-500/20"
            >
              <Cloud className="w-3.5 h-3.5 mr-2" />
              Guardar en Drive
            </button>

            <button
              onClick={onOpenDrivePicker}
              className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Restaurar Drive
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => downloadDataAsJson(records)}
                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                title="Descargar Local"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Local
              </button>
              <button
                onClick={handleTriggerLocalImport}
                className="flex items-center justify-center px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all"
                title="Cargar Local"
              >
                <Upload className="w-3.5 h-3.5 mr-1" /> Restaurar
              </button>
              <input type="file" ref={localImportInputRef} onChange={onLocalImport} accept=".json" className="hidden" />
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Salir
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72">
        <header className="shrink-0 sticky top-0 z-30 flex flex-col md:flex-row items-center justify-between px-4 md:px-6 transition-all glass pt-2 pb-2 md:pt-4 md:pb-3 gap-2 md:gap-0 shadow-sm border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden mr-3 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              {viewMode !== 'daily' && (
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  {viewMode === 'search' && 'Búsqueda'}
                  {viewMode === 'stats' && 'Estadísticas'}
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

          <div className="flex items-center gap-3 hidden md:flex">
            {viewMode === 'daily' && (
              <>
                <Button
                  variant="secondary"
                  onClick={onGenerateReport}
                  className="shadow-sm border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-md"
                >
                  Reporte Turno
                </Button>
                <Button onClick={onOpenNewPatient} className="shadow-md hover:shadow-lg">
                  Nuevo Paciente
                </Button>
              </>
            )}
          </div>
        </header>

        <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 relative scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;

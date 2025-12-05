import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart2, Bookmark as BookmarkIcon, Calendar as CalendarIcon, CheckSquare, Cloud, Download, LogOut, RefreshCw, Settings as SettingsIcon, Upload, Users, X } from 'lucide-react';
import GoogleConnectionStatus from '../components/GoogleConnectionStatus';
import { downloadDataAsJson } from '../services/storage';
import { Bookmark, BookmarkCategory, GeneralTask, PatientRecord, PatientTypeConfig, User, ViewMode } from '../types';

interface MainSidebarProps {
  viewMode: ViewMode;
  user: User;
  records: PatientRecord[];
  generalTasks: GeneralTask[];
  patientTypes: PatientTypeConfig[];
  bookmarks: Bookmark[];
  bookmarkCategories: BookmarkCategory[];
  isOpen: boolean;
  isMobile: boolean;
  showBookmarkBar?: boolean;
  onNavigate: (view: ViewMode) => void;
  onOpenBackupModal: () => void;
  onOpenDrivePicker: () => void;
  onLogout: () => void;
  onLocalImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onPrefetchView?: (view: ViewMode) => void;
  onPrefetchModal?: (modalType: 'patientModal' | 'backupModal' | 'drivePickerModal' | 'bookmarksModal') => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  viewMode,
  user,
  records,
  generalTasks,
  patientTypes,
  bookmarks,
  bookmarkCategories,
  isOpen,
  isMobile,
  showBookmarkBar = false,
  onNavigate,
  onOpenBackupModal,
  onOpenDrivePicker,
  onLogout,
  onLocalImport,
  onClose,
  onPrefetchView,
  onPrefetchModal,
}) => {
  const localImportInputRef = useRef<HTMLInputElement>(null);
  const [shouldRenderOverlay, setShouldRenderOverlay] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRenderOverlay(true);
    }
  }, [isOpen]);

  const handleNavigation = (view: ViewMode) => {
    onNavigate(view);
    if (isMobile) {
      onClose();
    }
  };

  const handleTriggerLocalImport = () => {
    localImportInputRef.current?.click();
  };

  const bookmarkBarOffset = useMemo(() => (showBookmarkBar ? 52 : 0), [showBookmarkBar]);

  const handleOverlayTransitionEnd = () => {
    if (!isOpen) {
      setShouldRenderOverlay(false);
    }
  };

  return (
    <>
      {shouldRenderOverlay && (
        <div
          className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
          onClick={onClose}
          onTransitionEnd={handleOverlayTransitionEnd}
        />
      )}

      <aside
        key="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r-0 transform transition-all duration-300 ease-out flex flex-col h-full ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0 md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-lg md:h-screen md:z-40 md:border-r md:border-gray-200/60 md:dark:border-gray-800/60 md:shadow-sm flex-shrink-0`}
        style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/icon.svg"
              alt="MediDiario icon"
              className="w-9 h-9 rounded-xl shadow-lg shadow-blue-500/20"
              loading="lazy"
              decoding="async"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">MediDiario</h1>
          </div>
          <button
            onClick={onClose}
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
            { id: 'history', label: 'Historial de Pacientes', icon: Users },
            { id: 'bookmarks', label: 'Marcadores', icon: BookmarkIcon },
            { id: 'stats', label: 'Estadísticas', icon: BarChart2 },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id as ViewMode)}
              onMouseEnter={() => onPrefetchView?.(item.id as ViewMode)}
              onFocus={() => onPrefetchView?.(item.id as ViewMode)}
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

          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-700/30 mx-4" />
          <button
            onClick={() => handleNavigation('settings')}
            onMouseEnter={() => onPrefetchView?.('settings')}
            onFocus={() => onPrefetchView?.('settings')}
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

          <div className="mb-3 flex justify-center">
            <GoogleConnectionStatus />
          </div>

          <div className="space-y-2">
            <button
              onClick={onOpenBackupModal}
              onMouseEnter={() => onPrefetchModal?.('backupModal')}
              onFocus={() => onPrefetchModal?.('backupModal')}
              className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-md shadow-green-500/20"
            >
              <Cloud className="w-3.5 h-3.5 mr-2" />
              Guardar en Drive
            </button>

            <button
              onClick={onOpenDrivePicker}
              onMouseEnter={() => onPrefetchModal?.('drivePickerModal')}
              onFocus={() => onPrefetchModal?.('drivePickerModal')}
              className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Restaurar Drive
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() =>
                  downloadDataAsJson({
                    patients: records,
                    generalTasks,
                    patientTypes,
                    bookmarks,
                    bookmarkCategories,
                  })
                }
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

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => window.open('https://mail.google.com', '_blank', 'noopener,noreferrer')}
                className="flex items-center justify-center px-2 py-2 text-xs font-semibold text-red-600 bg-white border border-red-100 hover:border-red-200 hover:shadow-sm rounded-lg transition-all"
                title="Abrir Gmail"
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4 mr-1" aria-hidden="true">
                  <path fill="#EA4335" d="M6 39V11.25L18 21.5l12-10.25L42 11v28H6z" />
                  <path fill="#FBBC04" d="M6 11.25V39l12-12.75z" />
                  <path fill="#34A853" d="M42 39V11l-12 15.25z" />
                  <path fill="#C5221F" d="M30 11.25H18L24 16z" />
                </svg>
                Gmail
              </button>

              <button
                onClick={() => window.open('https://drive.google.com', '_blank', 'noopener,noreferrer')}
                className="flex items-center justify-center px-2 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-100 hover:border-blue-200 hover:shadow-sm rounded-lg transition-all"
                title="Abrir Google Drive"
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4 mr-1" aria-hidden="true">
                  <path fill="#0F9D58" d="m10.4 34.6 7.7-13.3H36l-7.8 13.3z" />
                  <path fill="#4285F4" d="M36 34.6h-9.6l7.8-13.3L44 21z" />
                  <path fill="#F4B400" d="m20.7 8 7.7 13.3h-15L6 21z" />
                </svg>
                Drive
              </button>
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
    </>
  );
};

export default MainSidebar;

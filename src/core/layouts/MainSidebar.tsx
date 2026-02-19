import React from 'react';
import { Calendar as CalendarIcon, CheckSquare, FileText, LogOut, Users, X } from 'lucide-react';
import { ViewMode } from '@shared/types';
import ConnectionStatus from '@core/app/components/ConnectionStatus';
import { useNavigation } from '@shared/hooks/useNavigation';
import { useUser } from '@core/app/state/useAppState';
import { useAppActions } from '@core/app/state/useAppActions';

interface MainSidebarProps {
  isSidebarOpen: boolean;
  onOpenAppMenu: () => void;
  onCloseSidebar: () => void;
  onPrefetchView?: (view: ViewMode) => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isSidebarOpen,
  onOpenAppMenu,
  onCloseSidebar,
  onPrefetchView,
}) => {
  const { currentView: viewMode, navigate: onNavigate } = useNavigation();
  const user = useUser();
  const { logout } = useAppActions();

  if (!user) return null;

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity print:hidden"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        key="main-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col h-full print:hidden ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } md:translate-x-0 md:bg-white/90 md:dark:bg-gray-900/90 md:backdrop-blur-2xl md:h-screen md:z-40 md:border-r md:border-gray-200/50 md:dark:border-white/5 md:shadow-sm flex-shrink-0`}
      >
        <div className="pt-8 px-7 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenAppMenu}
              className="flex items-center space-x-3 hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 rounded-2xl group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-brand-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
                <img
                  src="/icon.svg"
                  alt="MediDiario icon"
                  className="w-10 h-10 rounded-xl shadow-premium relative z-10 transform group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white tracking-tightest">MediDiario</h1>
            </button>
          </div>
          <button
            onClick={onCloseSidebar}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-7 mb-4">
          <ConnectionStatus />
        </div>

        <nav className="px-4 py-2 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] uppercase tracking-[0.2em] font-extrabold text-gray-400/80 mb-3 mt-4">Navegación</p>
          {[
            { id: 'daily', label: 'Agenda Diaria', icon: CalendarIcon },
            { id: 'tasks', label: 'Mis Tareas', icon: CheckSquare },
            { id: 'history', label: 'Historial', icon: Users },
            { id: 'reports', label: 'Informes', icon: FileText },
          ].map((item) => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id as ViewMode);
                  onCloseSidebar();
                }}
                onMouseEnter={() => onPrefetchView?.(item.id as ViewMode)}
                onFocus={() => onPrefetchView?.(item.id as ViewMode)}
                className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-[13px] font-semibold transition-all duration-300 group relative overflow-hidden ${isActive
                  ? 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 shadow-premium-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:translate-x-1'
                  }`}
              >
                <item.icon
                  className={`w-5 h-5 mr-3 transition-all duration-300 ${isActive
                    ? 'text-brand-500 scale-110'
                    : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-500 rounded-r-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 m-5 rounded-[22px] bg-gray-50/60 dark:bg-white/5 border border-gray-100 dark:border-white/5 backdrop-blur-md shadow-premium-sm">
          <div className="flex items-center mb-5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center text-lg font-bold ring-4 ring-white dark:ring-gray-900 shadow-premium">
              {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="ml-3.5 overflow-hidden">
              <p className="text-sm font-bold text-gray-950 dark:text-white truncate tracking-tight">{user.name || 'Usuario'}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate opacity-70 font-medium uppercase tracking-wider">{user.email || 'Sin email'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-[11px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> CERRAR SESIÓN
          </button>
        </div>
      </aside>
    </>
  );
};

export default MainSidebar;

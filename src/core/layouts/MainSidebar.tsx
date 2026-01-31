import React from 'react';
import { Calendar as CalendarIcon, CheckSquare, FileText, LogOut, Users, X } from 'lucide-react';
import { ViewMode, User } from '@shared/types';

interface MainSidebarProps {
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  user: User;
  onOpenAppMenu: () => void;
  onCloseSidebar: () => void;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  onPrefetchView?: (view: ViewMode) => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isSidebarOpen,
  viewMode,
  user,
  onOpenAppMenu,
  onCloseSidebar,
  onNavigate,
  onLogout,
  onPrefetchView,
}) => (
  <>
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
        onClick={onCloseSidebar}
      />
    )}

    <aside
      key="main-sidebar"
      className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r-0 transform transition-all duration-300 ease-out flex flex-col h-full ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } md:translate-x-0 md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-lg md:h-screen md:z-40 md:border-r md:border-gray-200/60 md:dark:border-gray-800/60 md:shadow-sm flex-shrink-0`}
    >
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAppMenu}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
          >
            <img
              src="/icon.svg"
              alt="MediDiario icon"
              className="w-9 h-9 rounded-xl shadow-lg shadow-blue-500/20"
              loading="lazy"
              decoding="async"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">MediDiario</h1>
          </button>
        </div>
        <button
          onClick={onCloseSidebar}
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
          { id: 'reports', label: 'Informes Clínicos', icon: FileText },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id as ViewMode)}
            onMouseEnter={() => onPrefetchView?.(item.id as ViewMode)}
            onFocus={() => onPrefetchView?.(item.id as ViewMode)}
            className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${viewMode === item.id
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:translate-x-1'
              }`}
          >
            <item.icon
              className={`w-5 h-5 mr-3 transition-colors ${viewMode === item.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`}
            />
            {item.label}
          </button>
        ))}
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

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-2"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> Salir
        </button>
      </div>
    </aside>
  </>
);

export default MainSidebar;

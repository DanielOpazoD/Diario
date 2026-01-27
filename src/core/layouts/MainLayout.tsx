import React, { useMemo, useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckSquare, LogOut, Menu, Users, X } from 'lucide-react';
import { DateNavigator } from '@features/daily';
import { ViewMode, PatientRecord, User } from '@shared/types';
import { BookmarksBar } from '@features/bookmarks';

interface MainLayoutProps {
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User;
  currentDate: Date;
  records: PatientRecord[];
  onDateChange: (date: Date) => void;
  onOpenNewPatient: () => void;
  onLogout: () => void;
  onOpenBookmarksModal: () => void;
  onOpenAppMenu: () => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  showBookmarkBar?: boolean;
  children: React.ReactNode;
  onPrefetchView?: (view: ViewMode) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  viewMode,
  onNavigate,
  user,
  currentDate,
  records,
  onDateChange,
  onOpenNewPatient,
  onLogout,
  onOpenBookmarksModal,
  onOpenAppMenu,
  contentRef,
  showBookmarkBar = false,
  children,
  onPrefetchView,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [viewMode, isMobile]);

  const handleNavigation = (view: ViewMode) => {
    onNavigate(view);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const bookmarkBarOffset = showBookmarkBar ? 52 : 0;

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500"
      style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
    >
      {showBookmarkBar && <BookmarksBar onOpenManager={onOpenBookmarksModal} />}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
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
              { id: 'history', label: 'Historial de Pacientes', icon: Users },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id as ViewMode)}
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

        <main
          className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72 min-h-0"
        >
          <div
            className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-sm border-b border-gray-200/60 dark:border-gray-800/60"
          >
            <header className="shrink-0 transition-all glass pt-2 pb-2 md:pt-4 md:pb-3">
              <div className="max-w-5xl mx-auto w-full px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
                <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
                  <div className="flex items-center">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="md:hidden mr-3 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:bg-gray-200 dark:active:bg-gray-700"
                    >
                      <Menu className="w-6 h-6" />
                    </button>
                    {viewMode !== 'daily' && viewMode !== 'tasks' && (
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                        {viewMode === 'stats' && 'Estadí­sticas'}
                        {viewMode === 'bookmarks' && 'Marcadores'}
                        {viewMode === 'tasks' && 'Tareas'}
                        {viewMode === 'settings' && 'Ajustes'}
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

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-6 pt-2 md:pt-3 pb-4 md:pb-6 relative scroll-smooth min-h-0"
          >
            {children}
          </div>
        </main>
      </div >
    </div >
  );
};

export default MainLayout;

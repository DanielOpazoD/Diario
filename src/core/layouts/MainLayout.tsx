import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ViewMode, PatientRecord, User } from '@shared/types';
import { BookmarksBar } from '@features/bookmarks';
import MainSidebar from '@core/layouts/MainSidebar';
import MainTopBar from '@core/layouts/MainTopBar';

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

  const handleNavigation = useCallback((view: ViewMode) => {
    onNavigate(view);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, onNavigate]);

  const bookmarkBarOffset = showBookmarkBar ? 52 : 0;

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500"
      style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
    >
      {showBookmarkBar && <BookmarksBar onOpenManager={onOpenBookmarksModal} />}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <MainSidebar
          isSidebarOpen={isSidebarOpen}
          viewMode={viewMode}
          user={user}
          onOpenAppMenu={onOpenAppMenu}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onNavigate={handleNavigation}
          onLogout={onLogout}
          onPrefetchView={onPrefetchView}
        />

        <main
          className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72 min-h-0"
        >
          <MainTopBar
            viewMode={viewMode}
            currentDate={currentDate}
            records={records}
            onDateChange={onDateChange}
            onOpenNewPatient={onOpenNewPatient}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

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

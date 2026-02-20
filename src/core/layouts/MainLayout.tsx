import React, { useMemo, useState, useEffect } from 'react';
import MainSidebar from '@core/layouts/MainSidebar';
import MainTopBar from '@core/layouts/MainTopBar';
import { useNavigation } from '@shared/hooks/useNavigation';
import { ViewMode } from '@shared/types';

interface MainLayoutProps {
  onOpenNewPatient: () => void;
  onOpenAppMenu: () => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  showBookmarkBar?: boolean;
  bookmarkBar?: React.ReactNode;
  dailyDateNavigator?: React.ReactNode;
  children: React.ReactNode;
  onPrefetchView?: (view: ViewMode) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  onOpenNewPatient,
  onOpenAppMenu,
  contentRef,
  showBookmarkBar = false,
  bookmarkBar,
  dailyDateNavigator,
  children,
  onPrefetchView,
}) => {
  const { currentView: viewMode } = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [viewMode, isMobile]);

  const bookmarkBarOffset = showBookmarkBar ? 52 : 0;

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500 print:h-auto print:overflow-visible"
      style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
    >
      {showBookmarkBar && bookmarkBar}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <MainSidebar
          isSidebarOpen={isSidebarOpen}
          onOpenAppMenu={onOpenAppMenu}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onPrefetchView={onPrefetchView}
        />

        <main
          className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72 print:ml-0 print:h-auto print:overflow-visible min-h-0"
        >
          <MainTopBar
            viewMode={viewMode}
            onOpenNewPatient={onOpenNewPatient}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            dailyDateNavigator={dailyDateNavigator}
          />

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-1 md:px-2 pt-2 md:pt-3 pb-4 md:pb-6 relative scroll-smooth min-h-0 print:p-0 print:overflow-visible"
          >
            {children}
          </div>
        </main>
      </div >
    </div >
  );
};

export default MainLayout;

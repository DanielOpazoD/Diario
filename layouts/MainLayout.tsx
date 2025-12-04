import React, { useMemo, useState, useEffect } from 'react';
import { ViewMode, PatientRecord, User, GeneralTask, PatientTypeConfig, Bookmark, BookmarkCategory } from '../types';
import BookmarksBar from '../components/BookmarksBar';
import MainSidebar from './MainSidebar';
import MainHeader from './MainHeader';

interface MainLayoutProps {
  viewMode: ViewMode;
  onNavigate: (view: ViewMode) => void;
  user: User;
  currentDate: Date;
  records: PatientRecord[];
  generalTasks: GeneralTask[];
  patientTypes: PatientTypeConfig[];
  bookmarks: Bookmark[];
  bookmarkCategories: BookmarkCategory[];
  onDateChange: (date: Date) => void;
  onOpenNewPatient: () => void;
  onOpenBackupModal: () => void;
  onOpenDrivePicker: () => void;
  onLogout: () => void;
  onLocalImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenBookmarksModal: () => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  showBookmarkBar?: boolean;
  children: React.ReactNode;
  onPrefetchView?: (view: ViewMode) => void;
  onPrefetchModal?: (modalType: 'patientModal' | 'backupModal' | 'drivePickerModal' | 'bookmarksModal') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  viewMode,
  onNavigate,
  user,
  currentDate,
  records,
  generalTasks,
  patientTypes,
  bookmarks,
  bookmarkCategories,
  onDateChange,
  onOpenNewPatient,
  onOpenBackupModal,
  onOpenDrivePicker,
  onLogout,
  onLocalImport,
  onOpenBookmarksModal,
  contentRef,
  showBookmarkBar = false,
  children,
  onPrefetchView,
  onPrefetchModal,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [viewMode, isMobile]);

  const bookmarkBarOffset = showBookmarkBar ? 52 : 0;

  const handleCloseSidebar = () => setIsSidebarOpen(false);
  const handleOpenSidebar = () => setIsSidebarOpen(true);

  return (
    <div
      className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500"
      style={{ paddingTop: bookmarkBarOffset ? `${bookmarkBarOffset}px` : undefined }}
    >
      {showBookmarkBar && <BookmarksBar onOpenManager={onOpenBookmarksModal} />}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <MainSidebar
          viewMode={viewMode}
          user={user}
          records={records}
          generalTasks={generalTasks}
          patientTypes={patientTypes}
          bookmarks={bookmarks}
          bookmarkCategories={bookmarkCategories}
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          showBookmarkBar={showBookmarkBar}
          onNavigate={onNavigate}
          onOpenBackupModal={onOpenBackupModal}
          onOpenDrivePicker={onOpenDrivePicker}
          onLogout={onLogout}
          onLocalImport={onLocalImport}
          onClose={handleCloseSidebar}
          onPrefetchView={onPrefetchView}
          onPrefetchModal={onPrefetchModal}
        />

        <main
          className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-gray-950 overflow-hidden md:ml-72 min-h-0"
        >
          <div
            className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-sm border-b border-gray-200/60 dark:border-gray-800/60"
          >
            <MainHeader
              viewMode={viewMode}
              currentDate={currentDate}
              records={records}
              onDateChange={onDateChange}
              onOpenSidebar={handleOpenSidebar}
              onOpenNewPatient={onOpenNewPatient}
            />
          </div>

          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto custom-scrollbar px-3 md:px-6 pt-2 md:pt-3 pb-4 md:pb-6 relative scroll-smooth min-h-0"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

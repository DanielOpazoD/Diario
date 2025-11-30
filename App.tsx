import React, { useState, useMemo, useLayoutEffect, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { format, isSameDay } from 'date-fns';
import { ViewMode } from './shared/types/index.ts';
import { LogProvider, useLogger } from './context/LogContext';
import { QueryProvider } from './providers/QueryProvider';
import useAppStore from './stores/useAppStore';
import useAutoLock from './shared/hooks/useAutoLock';
import { usePrefetch, prefetchAdjacentViews } from './shared/hooks/usePrefetch';
import useModalManager from './hooks/useModalManager';
import { usePatientCrud } from './features/patients';
import { useBackup } from './features/backup';
import useDriveFolderPreference from './hooks/useDriveFolderPreference';
import ErrorBoundary from './components/ErrorBoundary';

// Critical path components - loaded immediately
import Login from './components/Login';
import Toast from './shared/components/Toast';
import MainLayout from './layouts/MainLayout';
import LockScreen from './components/LockScreen';

// Loading skeletons for lazy-loaded components
import {
  ViewSkeleton,
  ModalSkeleton,
  StatsSkeleton,
  SettingsSkeleton,
  TasksSkeleton,
  BookmarksSkeleton,
  HistorySkeleton,
} from './shared/components/LoadingSkeletons';

// Lazy-loaded view components (micro-frontends)
const DailyView = lazy(() => import('./features/daily').then(module => ({ default: module.DailyView })));
const StatsView = lazy(() => import('./features/stats/StatsView'));
const PatientsHistoryView = lazy(() => import('./features/history/PatientsHistoryView'));
const BookmarksView = lazy(() => import('./features/bookmarks').then(module => ({ default: module.BookmarksView })));
const TaskDashboard = lazy(() => import('./components/TaskDashboard'));
const Settings = lazy(() => import('./components/Settings'));

// Lazy-loaded modal components (loaded on demand)
const PatientModal = lazy(() => import('./features/patients').then(module => ({ default: module.PatientModal })));
const ConfirmationModal = lazy(() => import('./shared/components/ConfirmationModal'));
const BackupModal = lazy(() => import('./features/backup').then(module => ({ default: module.BackupModal })));
const DrivePickerModal = lazy(() => import('./features/backup').then(module => ({ default: module.DrivePickerModal })));
const BookmarksModal = lazy(() => import('./features/bookmarks').then(module => ({ default: module.BookmarksModal })));
const DebugConsole = lazy(() => import('./components/DebugConsole'));

// Lazy-loaded services (heavy dependencies)
const loadReportService = () => import('./services/reportService');
const loadGoogleService = () => import('./services/googleService');
const loadGeminiService = () => import('./services/geminiService');

const AppContent: React.FC = () => {
  const { addLog } = useLogger();

  const user = useAppStore(state => state.user);
  const records = useAppStore(state => state.records);
  const generalTasks = useAppStore(state => state.generalTasks);
  const patientTypes = useAppStore(state => state.patientTypes);
  const bookmarks = useAppStore(state => state.bookmarks);
  const bookmarkCategories = useAppStore(state => state.bookmarkCategories);
  const showBookmarkBar = useAppStore(state => state.showBookmarkBar);
  const securityPin = useAppStore(state => state.securityPin);
  const autoLockMinutes = useAppStore(state => state.autoLockMinutes);
  const { logout, addToast, setRecords, setGeneralTasks, addPatient, updatePatient, deletePatient, setBookmarks, setBookmarkCategories } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  const {
    isPatientModalOpen,
    editingPatient,
    patientToDelete,
    isBackupModalOpen,
    isDrivePickerOpen,
    isBookmarksModalOpen,
    editingBookmarkId,
    openNewPatientModal,
    openEditPatientModal,
    closePatientModal,
    requestDeletePatient,
    closeDeleteConfirmation,
    openBackupModal,
    closeBackupModal,
    openDrivePicker,
    closeDrivePicker,
    openBookmarksModal,
    closeBookmarksModal,
    setEditingPatient,
    setPatientToDelete,
  } = useModalManager();

  const { driveFolderPreference, setDriveFolderPreference } = useDriveFolderPreference();

  const {
    handleSavePatient,
    handleSaveMultiplePatients,
    confirmDeletePatient,
    handleMovePatientsToDate,
    handleCopyPatientsToDate,
  } = usePatientCrud({
    records,
    editingPatient,
    patientToDelete,
    setEditingPatient,
    setPatientToDelete,
    setRecords,
    addPatient,
    updatePatient,
    deletePatient,
    addToast,
  });

  const { isUploading, handleLocalImport, handleBackupConfirm, handleDriveFileSelect } = useBackup({
    records,
    generalTasks,
    patientTypes,
    bookmarks,
    bookmarkCategories,
    setRecords,
    setGeneralTasks,
    setBookmarks,
    setBookmarkCategories,
    addToast,
    setIsBackupModalOpen: (open) => (open ? openBackupModal() : closeBackupModal()),
    setIsDrivePickerOpen: (open) => (open ? openDrivePicker() : closeDrivePicker()),
    setDriveFolderPreference,
  });

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { isLocked, handleUnlock: unlockWithPin } = useAutoLock({
    securityPin,
    autoLockMinutes,
    onLock: () => {
      if (securityPin) {
        addToast('info', 'Sesión bloqueada por inactividad');
      }
    },
    onUnlock: () => addToast('success', 'Sesión desbloqueada')
  });

  // Prefetching hook for predictive loading
  const { prefetchOnHover, prefetchModal } = usePrefetch(viewMode);

  // Prefetch adjacent views when view changes
  useEffect(() => {
    prefetchAdjacentViews(viewMode);
  }, [viewMode]);

  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [viewMode]);

  useEffect(() => {
    loadGeminiService()
      .then(({ validateEnvironment }) => validateEnvironment())
      .then(envStatus => addLog('info', 'App', 'Iniciando Aplicación', envStatus))
      .catch(error => addLog('error', 'App', 'No se pudo validar el entorno', { message: String(error) }));
  }, [addLog]);

  useEffect(() => {
    loadGoogleService().then(({ restoreStoredToken }) => restoreStoredToken());
  }, []);

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const handleLogout = async () => {
    const { clearStoredToken } = await loadGoogleService();
    clearStoredToken();
    logout();
  };

  const handleGeneratePDF = async () => {
    const { generateHandoverReport } = await loadReportService();
    generateHandoverReport(dailyRecords, currentDate, user?.name || 'Dr.');
    addToast('success', 'PDF Generado');
  };

  const handleUnlock = (pinAttempt: string) => {
    const success = unlockWithPin(pinAttempt);

    if (!success) {
      addToast('error', 'PIN incorrecto');
    }

    return success;
  };

  const handleNavigation = useCallback((view: ViewMode) => {
    setViewMode(view);
  }, []);

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      <Toast />
      <Suspense fallback={null}>
        <DebugConsole />
      </Suspense>
      {isLocked && securityPin && (
        <LockScreen onUnlock={handleUnlock} autoLockMinutes={autoLockMinutes} />
      )}

      <MainLayout
        viewMode={viewMode}
        onNavigate={handleNavigation}
        user={user}
        currentDate={currentDate}
        records={records}
        onDateChange={setCurrentDate}
        onOpenNewPatient={openNewPatientModal}
        onOpenBackupModal={openBackupModal}
        onOpenDrivePicker={openDrivePicker}
        onLogout={handleLogout}
        onLocalImport={handleLocalImport}
        onOpenBookmarksModal={() => openBookmarksModal(null)}
        contentRef={mainScrollRef}
        showBookmarkBar={showBookmarkBar}
        onPrefetchView={prefetchOnHover}
        onPrefetchModal={prefetchModal}
      >
        {viewMode === 'daily' && (
          <Suspense fallback={<ViewSkeleton />}>
            <DailyView
              currentDate={currentDate}
              records={records}
              patientTypes={patientTypes}
              onAddPatient={openNewPatientModal}
              onEditPatient={openEditPatientModal}
              onDeletePatient={requestDeletePatient}
              onGenerateReport={handleGeneratePDF}
              onMovePatients={handleMovePatientsToDate}
              onCopyPatients={handleCopyPatientsToDate}
            />
          </Suspense>
        )}

        {viewMode === 'history' && (
          <Suspense fallback={<HistorySkeleton />}>
            <PatientsHistoryView />
          </Suspense>
        )}

        {viewMode === 'stats' && (
          <Suspense fallback={<StatsSkeleton />}>
            <StatsView currentDate={currentDate} />
          </Suspense>
        )}

        {viewMode === 'tasks' && (
          <Suspense fallback={<TasksSkeleton />}>
            <TaskDashboard onNavigateToPatient={openEditPatientModal} />
          </Suspense>
        )}

        {viewMode === 'bookmarks' && (
          <Suspense fallback={<BookmarksSkeleton />}>
            <BookmarksView
              onAdd={() => openBookmarksModal(null)}
              onEdit={(bookmarkId) => openBookmarksModal(bookmarkId)}
            />
          </Suspense>
        )}

        {viewMode === 'settings' && (
          <Suspense fallback={<SettingsSkeleton />}>
            <Settings />
          </Suspense>
        )}
      </MainLayout>

      {isPatientModalOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <PatientModal
            isOpen={isPatientModalOpen}
            onClose={closePatientModal}
            onSave={handleSavePatient}
            onSaveMultiple={handleSaveMultiplePatients}
            addToast={addToast}
            initialData={editingPatient}
            selectedDate={format(currentDate, 'yyyy-MM-dd')}
          />
        </Suspense>
      )}
      {patientToDelete && (
        <Suspense fallback={null}>
          <ConfirmationModal
            isOpen={!!patientToDelete}
            onClose={closeDeleteConfirmation}
            onConfirm={confirmDeletePatient}
            title="Eliminar Paciente"
            message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
            isDangerous={true}
          />
        </Suspense>
      )}
      {isBackupModalOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <BackupModal
            isOpen={isBackupModalOpen}
            onClose={closeBackupModal}
            onConfirm={handleBackupConfirm}
            defaultFileName={`backup_medidiario_${format(new Date(), 'yyyy-MM-dd')}`}
            isLoading={isUploading}
            preferredFolder={driveFolderPreference}
            onFolderChange={setDriveFolderPreference}
          />
        </Suspense>
      )}
      {isDrivePickerOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <DrivePickerModal
            isOpen={isDrivePickerOpen}
            onClose={closeDrivePicker}
            onSelect={handleDriveFileSelect}
            isLoadingProp={isUploading}
            preferredFolder={driveFolderPreference}
            onFolderChange={setDriveFolderPreference}
          />
        </Suspense>
      )}
      {isBookmarksModalOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <BookmarksModal
            isOpen={isBookmarksModalOpen}
            onClose={closeBookmarksModal}
            editingBookmarkId={editingBookmarkId}
          />
        </Suspense>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <QueryProvider>
    <LogProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </LogProvider>
  </QueryProvider>
);

export default App;

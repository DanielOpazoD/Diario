import React, { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { ViewMode } from '../../types';
import { useLogger } from '../../context/LogContext';
import useAutoLock from '../../hooks/useAutoLock';
import useBackupManager from '../../hooks/useBackupManager';
import useDriveFolderPreference from '../../hooks/useDriveFolderPreference';
import useModalManager from '../../hooks/useModalManager';
import usePatientCrud from '../../hooks/usePatientCrud';
import useViewLifecycle from '../../hooks/useViewLifecycle';
import { usePrefetch } from '../../hooks/usePrefetch';
import useAppStartup from '../../hooks/useAppStartup';
import Login from '../../components/Login';
import Toast from '../../components/Toast';
import MainLayout from '../../layouts/MainLayout';
import LockScreen from '../../components/LockScreen';
import AppViews from '../../components/AppViews';
import AppModals from '../../components/AppModals';
import { useAppActions } from '../state/useAppActions';
import { useAppState } from '../state/useAppState';

const DebugConsole = lazy(() => import('../../components/DebugConsole'));
const loadReportService = () => import('../../services/reportService');
const loadGoogleService = () => import('../../services/googleService');

const AppShell: React.FC = () => {
  const { addLog } = useLogger();
  const {
    user,
    records,
    generalTasks,
    patientTypes,
    bookmarks,
    bookmarkCategories,
    showBookmarkBar,
    securityPin,
    autoLockMinutes,
  } = useAppState();

  const {
    logout,
    addToast,
    setRecords,
    setGeneralTasks,
    addPatient,
    updatePatient,
    deletePatient,
    setBookmarks,
    setBookmarkCategories,
    setPatientTypes,
  } = useAppActions();

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

  const { isUploading, handleLocalImport, handleBackupConfirm, handleDriveFileSelect } = useBackupManager({
    records,
    generalTasks,
    patientTypes,
    bookmarks,
    bookmarkCategories,
    setRecords,
    setGeneralTasks,
    setPatientTypes,
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

  const { prefetchOnHover, prefetchModal } = usePrefetch(viewMode);
  useViewLifecycle(viewMode, mainScrollRef);
  useAppStartup(addLog);

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const handleLogout = useCallback(async () => {
    const { clearStoredToken } = await loadGoogleService();
    clearStoredToken();
    logout();
  }, [logout]);

  const handleGeneratePDF = useCallback(async () => {
    const { generateHandoverReport } = await loadReportService();
    generateHandoverReport(dailyRecords, currentDate, user?.name || 'Dr.');
    addToast('success', 'PDF Generado');
  }, [addToast, currentDate, dailyRecords, user?.name]);

  const handleUnlock = useCallback((pinAttempt: string) => {
    const success = unlockWithPin(pinAttempt);

    if (!success) {
      addToast('error', 'PIN incorrecto');
    }

    return success;
  }, [addToast, unlockWithPin]);

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
        generalTasks={generalTasks}
        patientTypes={patientTypes}
        bookmarks={bookmarks}
        bookmarkCategories={bookmarkCategories}
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
        <AppViews
          viewMode={viewMode}
          currentDate={currentDate}
          records={records}
          patientTypes={patientTypes}
          onAddPatient={openNewPatientModal}
          onEditPatient={openEditPatientModal}
          onDeletePatient={requestDeletePatient}
          onGenerateReport={handleGeneratePDF}
          onMovePatients={handleMovePatientsToDate}
          onCopyPatients={handleCopyPatientsToDate}
          onOpenBookmarksModal={openBookmarksModal}
        />
      </MainLayout>

      <AppModals
        currentDate={currentDate}
        isPatientModalOpen={isPatientModalOpen}
        editingPatient={editingPatient}
        patientToDelete={patientToDelete}
        isBackupModalOpen={isBackupModalOpen}
        isDrivePickerOpen={isDrivePickerOpen}
        isBookmarksModalOpen={isBookmarksModalOpen}
        editingBookmarkId={editingBookmarkId}
        isUploading={isUploading}
        preferredFolder={driveFolderPreference}
        onToast={addToast}
        onClosePatientModal={closePatientModal}
        onSavePatient={handleSavePatient}
        onSaveMultiplePatients={handleSaveMultiplePatients}
        onCloseDeleteConfirmation={closeDeleteConfirmation}
        onConfirmDelete={confirmDeletePatient}
        onCloseBackupModal={closeBackupModal}
        onConfirmBackup={handleBackupConfirm}
        onCloseDrivePicker={closeDrivePicker}
        onSelectDriveFile={handleDriveFileSelect}
        onFolderChange={setDriveFolderPreference}
        onCloseBookmarksModal={closeBookmarksModal}
      />
    </div>
  );
};

export default AppShell;

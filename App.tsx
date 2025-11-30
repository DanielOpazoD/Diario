import React, { useState, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { isSameDay } from 'date-fns';
import { ViewMode } from './types';
import { LogProvider, useLogger } from './context/LogContext';
import { QueryProvider } from './providers/QueryProvider';
import useAppStore from './stores/useAppStore';
import useAutoLock from './hooks/useAutoLock';
import { usePrefetch } from './hooks/usePrefetch';
import useModalManager from './hooks/useModalManager';
import usePatientCrud from './hooks/usePatientCrud';
import useBackupManager from './hooks/useBackupManager';
import useDriveFolderPreference from './hooks/useDriveFolderPreference';
import useAppStartup from './hooks/useAppStartup';
import useViewLifecycle from './hooks/useViewLifecycle';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import Toast from './components/Toast';
import MainLayout from './layouts/MainLayout';
import LockScreen from './components/LockScreen';
import AppViews from './components/AppViews';
import AppModals from './components/AppModals';
import MasterPasswordGate from './components/MasterPasswordGate';
import { createPasswordRecord, verifyPassword } from './services/cryptoUtils';

const DebugConsole = lazy(() => import('./components/DebugConsole'));
const loadReportService = () => import('./services/reportService');
const loadGoogleService = () => import('./services/googleService');

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
  const masterPasswordHash = useAppStore(state => state.masterPasswordHash);
  const masterPasswordSalt = useAppStore(state => state.masterPasswordSalt);
  const masterPassword = useAppStore(state => state.masterPasswordSession);
  const isMasterUnlocked = useAppStore(state => state.isMasterUnlocked);
  const setMasterUnlocked = useAppStore(state => state.setMasterUnlocked);
  const setMasterPassword = useAppStore(state => state.setMasterPassword);
  const setMasterPasswordSession = useAppStore(state => state.setMasterPasswordSession);
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

  const hasMasterPassword = useMemo(
    () => Boolean(masterPasswordHash && masterPasswordSalt),
    [masterPasswordHash, masterPasswordSalt]
  );

  const handleMasterPasswordCreation = useCallback(
    async (password: string) => {
      const record = await createPasswordRecord(password);
      setMasterPassword(record.hash, record.salt);
      setMasterPasswordSession(password);
      setMasterUnlocked(true);
      addToast('success', 'Contraseña Maestra configurada');
      return true;
    },
    [addToast, setMasterPassword, setMasterPasswordSession, setMasterUnlocked]
  );

  const handleMasterPasswordUnlock = useCallback(
    async (password: string) => {
      if (!masterPasswordHash || !masterPasswordSalt) return false;

      const isValid = await verifyPassword(password, { hash: masterPasswordHash, salt: masterPasswordSalt });
      if (isValid) {
        setMasterUnlocked(true);
        setMasterPasswordSession(password);
        addToast('success', 'Sesión protegida desbloqueada');
      }
      return isValid;
    },
    [addToast, masterPasswordHash, masterPasswordSalt, setMasterPasswordSession, setMasterUnlocked]
  );

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
    masterPassword,
    masterPasswordHash,
    masterPasswordSalt,
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

  const { prefetchOnHover, prefetchModal } = usePrefetch(viewMode);
  useViewLifecycle(viewMode, mainScrollRef);
  useAppStartup(addLog);

  const dailyRecords = useMemo(
    () => records.filter(r => isSameDay(new Date(r.date + 'T00:00:00'), currentDate)),
    [records, currentDate]
  );

  const handleLogout = async () => {
    const { clearStoredToken } = await loadGoogleService();
    clearStoredToken();
    setMasterUnlocked(false);
    setMasterPasswordSession(null);
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

  if (!isMasterUnlocked) {
    return (
      <MasterPasswordGate
        hasMasterPassword={hasMasterPassword}
        onCreate={handleMasterPasswordCreation}
        onUnlock={handleMasterPasswordUnlock}
      />
    );
  }

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

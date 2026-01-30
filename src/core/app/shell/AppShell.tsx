import React, { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';

import { ViewMode } from '@shared/types';
import { useLogger } from '@core/context/LogContext';
import useAutoLock from '@core/hooks/useAutoLock';
import useModalManager from '@shared/hooks/useModalManager';
import { usePatientCrud } from '@core/patient';
import useViewLifecycle from '@shared/hooks/useViewLifecycle';
import { usePrefetch } from '@shared/hooks/usePrefetch';
import useAppStartup from '@core/hooks/useAppStartup';
import Login from '@core/components/Login';
import MainLayout from '@core/layouts/MainLayout';
import { Toast } from '@core/ui';
import LockScreen from '@core/components/LockScreen';
import UpdateBanner from '@core/components/UpdateBanner';
import { AppViews, AppModals } from '@features/daily';
import { useAppActions } from '@core/app/state/useAppActions';
import { useAppState } from '@core/app/state/useAppState';
import { pathFromView, viewFromPath } from '@shared/routes';
import AIChatEntry from '@features/ai/AIChatEntry';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import useRouteGuard from '@core/app/shell/useRouteGuard';

const DebugConsole = lazy(() => import('@core/components/DebugConsole'));
const AppShell: React.FC = () => {
  const { addLog } = useLogger();
  const showDebugConsole =
    typeof window !== 'undefined' &&
    localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
  const {
    user,
    records,
    patientTypes,
    showBookmarkBar,
    securityPin,
    autoLockMinutes,
  } = useAppState();

  const {
    logout,
    addToast,
    setRecords,
    addPatient,
    updatePatient,
    deletePatient,
  } = useAppActions();

  const [currentDate, setCurrentDate] = useState(new Date());
  const { location, navigate } = useRouteGuard();
  const viewMode = useMemo<ViewMode>(() => viewFromPath(location.pathname), [location.pathname]);

  const {
    isPatientModalOpen,
    editingPatient,
    patientToDelete,
    isBookmarksModalOpen,
    editingBookmarkId,
    isAppMenuOpen,
    openNewPatientModal,
    openEditPatientModal,
    closePatientModal,
    requestDeletePatient,
    closeDeleteConfirmation,
    openBookmarksModal,
    closeBookmarksModal,
    openAppMenu,
    closeAppMenu,
    setEditingPatient,
    setPatientToDelete,
    initialTab,
    patientModalMode,
  } = useModalManager();

  const {
    handleSavePatient,
    handleAutoSavePatient,
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

  const { prefetchOnHover } = usePrefetch(viewMode);
  useViewLifecycle(viewMode, mainScrollRef);
  useAppStartup(addLog);


  const handleLogout = useCallback(async () => {
    logout();
  }, [logout]);



  const handleUnlock = useCallback((pinAttempt: string) => {
    const success = unlockWithPin(pinAttempt);

    if (!success) {
      addToast('error', 'PIN incorrecto');
    }

    return success;
  }, [addToast, unlockWithPin]);

  const handleNavigation = useCallback((view: ViewMode) => {
    const target = pathFromView(view);
    if (location.pathname !== target) {
      navigate(target);
    }
  }, [location.pathname, navigate]);

  if (!user) return <Login />;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-500">
      <UpdateBanner />
      <Toast />
      {showDebugConsole && (
        <Suspense fallback={null}>
          <DebugConsole />
        </Suspense>
      )}
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
        onOpenBookmarksModal={() => openBookmarksModal(null)}
        onOpenAppMenu={openAppMenu}
        onLogout={handleLogout}
        contentRef={mainScrollRef}
        showBookmarkBar={showBookmarkBar}
        onPrefetchView={prefetchOnHover}
      >
        <AppViews
          currentDate={currentDate}
          records={records}
          patientTypes={patientTypes}
          onAddPatient={openNewPatientModal}
          onEditPatient={openEditPatientModal}
          onDeletePatient={requestDeletePatient}
          onMovePatients={handleMovePatientsToDate}
          onCopyPatients={handleCopyPatientsToDate}
          onOpenBookmarksModal={openBookmarksModal}
        />
      </MainLayout>

      <AppModals
        currentDate={currentDate}
        isPatientModalOpen={isPatientModalOpen}
        editingPatient={editingPatient}
        initialTab={initialTab}
        patientToDelete={patientToDelete}
        isBookmarksModalOpen={isBookmarksModalOpen}
        editingBookmarkId={editingBookmarkId}
        onToast={addToast}
        onClosePatientModal={closePatientModal}
        onSavePatient={handleSavePatient}
        onAutoSavePatient={handleAutoSavePatient}
        onSaveMultiplePatients={handleSaveMultiplePatients}
        onCloseDeleteConfirmation={closeDeleteConfirmation}
        onConfirmDelete={confirmDeletePatient}
        onCloseBookmarksModal={closeBookmarksModal}
        isAppMenuOpen={isAppMenuOpen}
        onCloseAppMenu={closeAppMenu}
        onNavigate={handleNavigation}
        patientModalMode={patientModalMode}
      />

      <AIChatEntry />
    </div>
  );
};

export default AppShell;

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { ViewMode } from '../../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogger } from '../../context/LogContext';
import useAutoLock from '../../hooks/useAutoLock';
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
import { DEFAULT_ROUTE, VIEW_ROUTES, pathFromView, viewFromPath } from '../../routes';
import AIChatDrawer from '../../components/AIChatDrawer';

const DebugConsole = lazy(() => import('../../components/DebugConsole'));
const loadReportService = () => import('../../services/reportService');
const loadGoogleService = () => import('../../services/googleService');

const AppShell: React.FC = () => {
  const { addLog } = useLogger();
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
  const location = useLocation();
  const navigate = useNavigate();
  const viewMode = useMemo<ViewMode>(() => viewFromPath(location.pathname), [location.pathname]);

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
    const knownRoutes = Object.values(VIEW_ROUTES).map(route => route.replace(/\/$/, '') || '/');

    if (!knownRoutes.includes(normalizedPath)) {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [location.pathname, navigate]);

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
  } = useModalManager();

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
    const target = pathFromView(view);
    if (location.pathname !== target) {
      navigate(target);
    }
  }, [location.pathname, navigate]);

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
        isBookmarksModalOpen={isBookmarksModalOpen}
        editingBookmarkId={editingBookmarkId}
        onToast={addToast}
        onClosePatientModal={closePatientModal}
        onSavePatient={handleSavePatient}
        onSaveMultiplePatients={handleSaveMultiplePatients}
        onCloseDeleteConfirmation={closeDeleteConfirmation}
        onConfirmDelete={confirmDeletePatient}
        onCloseBookmarksModal={closeBookmarksModal}
        isAppMenuOpen={isAppMenuOpen}
        onCloseAppMenu={closeAppMenu}
        onNavigate={handleNavigation}
      />

      <AIChatDrawer />
    </div>
  );
};

export default AppShell;

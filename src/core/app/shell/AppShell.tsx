import React, { lazy, Suspense, useRef, useCallback } from 'react';

import { useLogger } from '@core/context/LogContext';
import useAutoLock from '@core/hooks/useAutoLock';
import useViewLifecycle from '@shared/hooks/useViewLifecycle';
import { usePrefetch } from '@shared/hooks/usePrefetch';
import useAppStartup from '@core/hooks/useAppStartup';
import { useStorageHydration } from '@core/hooks/useStorageHydration';
import { useStorageMigration } from '@core/hooks/useStorageMigration';
import Login from '@core/components/Login';
import MainLayout from '@core/layouts/MainLayout';
import { Toast } from '@core/ui';
import LockScreen from '@core/components/LockScreen';
import UpdateBanner from '@core/components/UpdateBanner';
import { AppViews, AppModals, DateNavigator } from '@features/daily';
import { BookmarksBar } from '@features/bookmarks';
import { useAppActions } from '@core/app/state/useAppActions';
import { useUser, useRecords, useShowBookmarkBar, useSecurityConfig, useCurrentDate } from '@core/app/state/useAppState';
import { useNavigation } from '@shared/hooks/useNavigation';
import AIChatEntry from '@features/ai/AIChatEntry';
import { getDebugModeFlag } from '@shared/utils/storageFlags';
import useRouteGuard from '@core/app/shell/useRouteGuard';

const DebugConsole = lazy(() => import('@core/components/DebugConsole'));

const AppShell: React.FC = () => {
  const { addLog } = useLogger();
  const showDebugConsole = getDebugModeFlag();

  const user = useUser();
  const records = useRecords();
  const showBookmarkBar = useShowBookmarkBar();
  const { securityPinHash, securityPinSalt, autoLockMinutes } = useSecurityConfig();
  const currentDate = useCurrentDate();

  const {
    setCurrentDate,
    openNewPatientModal,
    openBookmarksModal,
    openAppMenu,
    addToast,
  } = useAppActions();

  const { currentView: viewMode } = useNavigation();
  useRouteGuard();

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const { isLocked, handleUnlock: unlockWithPin } = useAutoLock({
    securityPinHash,
    securityPinSalt,
    autoLockMinutes,
    onLock: () => {
      if (securityPinHash && securityPinSalt) {
        addToast('info', 'Sesión bloqueada por inactividad');
      }
    },
    onUnlock: () => addToast('success', 'Sesión desbloqueada')
  });

  const handleUnlock = useCallback(async (pinAttempt: string) => {
    const success = await unlockWithPin(pinAttempt);
    if (!success) {
      addToast('error', 'PIN incorrecto');
    }
    return success;
  }, [addToast, unlockWithPin]);

  const { prefetchOnHover } = usePrefetch(viewMode);
  useViewLifecycle(viewMode, mainScrollRef);
  useAppStartup(addLog);
  useStorageMigration(addLog);
  useStorageHydration(addLog);

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
      {isLocked && securityPinHash && securityPinSalt && (
        <LockScreen onUnlock={handleUnlock} autoLockMinutes={autoLockMinutes} />
      )}

      <MainLayout
        onOpenNewPatient={openNewPatientModal}
        onOpenAppMenu={openAppMenu}
        contentRef={mainScrollRef}
        showBookmarkBar={showBookmarkBar}
        bookmarkBar={<BookmarksBar onOpenManager={() => openBookmarksModal()} />}
        dailyDateNavigator={(
          <DateNavigator currentDate={currentDate} onSelectDate={setCurrentDate} records={records} />
        )}
        onPrefetchView={prefetchOnHover}
      >
        <AppViews />
      </MainLayout>

      <AppModals />

      <AIChatEntry />
    </div>
  );
};

export default AppShell;

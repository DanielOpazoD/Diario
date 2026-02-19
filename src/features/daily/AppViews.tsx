import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DEFAULT_ROUTE, VIEW_ROUTES } from '@shared/routes';
import {
  ViewSkeleton,
  StatsSkeleton,
  SettingsSkeleton,
  TasksSkeleton,
  BookmarksSkeleton,
  HistorySkeleton,
  FeatureErrorBoundary,
} from '@core/ui';
import { useCurrentDate, useRecords, usePatientTypes } from '@core/app/state/useAppState';
import { useAppActions } from '@core/app/state/useAppActions';
import { usePatientCrud } from '@core/patient';
import { useLocation } from 'react-router-dom';

const DailyView = lazy(() => import('@features/daily/DailyView'));
const StatsView = lazy(() => import('@features/stats/Stats'));
const PatientsHistoryView = lazy(() => import('@features/history/PatientsHistoryView'));
const BookmarksView = lazy(() => import('@features/bookmarks/BookmarksView'));
const TaskDashboard = lazy(() => import('@features/daily/TaskDashboard'));
const Settings = lazy(() => import('@features/settings/Settings'));
const ReportAppAdapter = lazy(() => import('@features/daily/components/ReportAppAdapter'));

const AppViews: React.FC = () => {
  const location = useLocation();
  const currentDate = useCurrentDate();
  const records = useRecords();
  const patientTypes = usePatientTypes();

  const {
    openNewPatientModal,
    openEditPatientModal,
    requestDeletePatient,
    openBookmarksModal,
  } = useAppActions();

  const {
    handleMovePatientsToDate,
    handleCopyPatientsToDate,
  } = usePatientCrud();

  React.useLayoutEffect(() => {
    if (document.startViewTransition) {
      document.startViewTransition();
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route
        path={VIEW_ROUTES.daily}
        element={(
          <FeatureErrorBoundary featureName="Diario">
            <Suspense fallback={<ViewSkeleton />}>
              <DailyView
                currentDate={currentDate}
                records={records}
                patientTypes={patientTypes}
                onAddPatient={openNewPatientModal}
                onEditPatient={openEditPatientModal}
                onDeletePatient={requestDeletePatient}
                onMovePatients={handleMovePatientsToDate}
                onCopyPatients={handleCopyPatientsToDate}
              />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.history}
        element={(
          <FeatureErrorBoundary featureName="Historial">
            <Suspense fallback={<HistorySkeleton />}>
              <PatientsHistoryView onEditPatient={openEditPatientModal} />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.stats}
        element={(
          <FeatureErrorBoundary featureName="Estadísticas">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsView currentDate={currentDate} />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.tasks}
        element={(
          <FeatureErrorBoundary featureName="Tareas">
            <Suspense fallback={<TasksSkeleton />}>
              <TaskDashboard onNavigateToPatient={openEditPatientModal} />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.bookmarks}
        element={(
          <FeatureErrorBoundary featureName="Marcadores">
            <Suspense fallback={<BookmarksSkeleton />}>
              <BookmarksView
                onAdd={() => openBookmarksModal(null)}
                onEdit={(bookmarkId) => openBookmarksModal(bookmarkId)}
              />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.settings}
        element={(
          <FeatureErrorBoundary featureName="Configuración">
            <Suspense fallback={<SettingsSkeleton />}>
              <Settings />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route
        path={VIEW_ROUTES.reports}
        element={(
          <FeatureErrorBoundary featureName="Informes">
            <Suspense fallback={<ViewSkeleton />}>
              <ReportAppAdapter />
            </Suspense>
          </FeatureErrorBoundary>
        )}
      />
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
};

export default AppViews;

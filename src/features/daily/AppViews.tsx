import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PatientRecord, PatientTypeConfig } from '@shared/types';
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

const DailyView = lazy(() => import('@features/daily/DailyView'));
const StatsView = lazy(() => import('@features/stats/Stats'));
const PatientsHistoryView = lazy(() => import('@features/history/PatientsHistoryView'));
const BookmarksView = lazy(() => import('@features/bookmarks/BookmarksView'));
const TaskDashboard = lazy(() => import('@features/daily/TaskDashboard'));
const Settings = lazy(() => import('@features/settings/Settings'));
const ReportAppAdapter = lazy(() => import('@features/daily/components/ReportAppAdapter'));

interface AppViewsProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files', mode?: 'daily' | 'history') => void;
  onDeletePatient: (patientId: string) => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
  onOpenBookmarksModal: (bookmarkId: string | null) => void;
}

import { useLocation } from 'react-router-dom';

const AppViews: React.FC<AppViewsProps> = ({
  currentDate,
  records,
  patientTypes,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onMovePatients,
  onCopyPatients,
  onOpenBookmarksModal,
}) => {
  const location = useLocation();

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
                onAddPatient={onAddPatient}
                onEditPatient={onEditPatient}
                onDeletePatient={onDeletePatient}
                onMovePatients={onMovePatients}
                onCopyPatients={onCopyPatients}
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
              <PatientsHistoryView onEditPatient={onEditPatient} />
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
              <TaskDashboard onNavigateToPatient={onEditPatient} />
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
                onAdd={() => onOpenBookmarksModal(null)}
                onEdit={(bookmarkId) => onOpenBookmarksModal(bookmarkId)}
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
            <ReportAppAdapter />
          </FeatureErrorBoundary>
        )}
      />
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
};

export default AppViews;

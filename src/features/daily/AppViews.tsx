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
} from '@core/ui';

const DailyView = lazy(() => import('@features/daily').then(m => ({ default: m.DailyView })));
const StatsView = lazy(() => import('@features/stats').then(m => ({ default: m.Stats })));
const PatientsHistoryView = lazy(() => import('@features/history').then(m => ({ default: m.PatientsHistoryView })));
const BookmarksView = lazy(() => import('@features/bookmarks').then(m => ({ default: m.BookmarksView })));
const TaskDashboard = lazy(() => import('@features/daily').then(m => ({ default: m.TaskDashboard })));
const Settings = lazy(() => import('@features/settings').then(m => ({ default: m.Settings })));

interface AppViewsProps {
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord, initialTab?: 'clinical' | 'files') => void;
  onDeletePatient: (patientId: string) => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
  onOpenBookmarksModal: (bookmarkId: string | null) => void;
}

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
  return (
    <Routes>
      <Route
        path={VIEW_ROUTES.daily}
        element={(
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
        )}
      />
      <Route
        path={VIEW_ROUTES.history}
        element={(
          <Suspense fallback={<HistorySkeleton />}>
            <PatientsHistoryView />
          </Suspense>
        )}
      />
      <Route
        path={VIEW_ROUTES.stats}
        element={(
          <Suspense fallback={<StatsSkeleton />}>
            <StatsView currentDate={currentDate} />
          </Suspense>
        )}
      />
      <Route
        path={VIEW_ROUTES.tasks}
        element={(
          <Suspense fallback={<TasksSkeleton />}>
            <TaskDashboard onNavigateToPatient={onEditPatient} />
          </Suspense>
        )}
      />
      <Route
        path={VIEW_ROUTES.bookmarks}
        element={(
          <Suspense fallback={<BookmarksSkeleton />}>
            <BookmarksView
              onAdd={() => onOpenBookmarksModal(null)}
              onEdit={(bookmarkId) => onOpenBookmarksModal(bookmarkId)}
            />
          </Suspense>
        )}
      />
      <Route
        path={VIEW_ROUTES.settings}
        element={(
          <Suspense fallback={<SettingsSkeleton />}>
            <Settings />
          </Suspense>
        )}
      />
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
};

export default AppViews;

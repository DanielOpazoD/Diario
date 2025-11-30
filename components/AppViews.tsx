import React, { Suspense, lazy } from 'react';
import { ViewMode, PatientRecord } from '../types';
import {
  ViewSkeleton,
  StatsSkeleton,
  SettingsSkeleton,
  TasksSkeleton,
  BookmarksSkeleton,
  HistorySkeleton,
} from './LoadingSkeletons';

const DailyView = lazy(() => import('../features/daily/DailyView'));
const StatsView = lazy(() => import('../features/stats/StatsView'));
const PatientsHistoryView = lazy(() => import('../features/history/PatientsHistoryView'));
const BookmarksView = lazy(() => import('../features/bookmarks/BookmarksView'));
const TaskDashboard = lazy(() => import('./TaskDashboard'));
const Settings = lazy(() => import('./Settings'));

interface AppViewsProps {
  viewMode: ViewMode;
  currentDate: Date;
  records: PatientRecord[];
  patientTypes: any[];
  onAddPatient: () => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onGenerateReport: () => void;
  onMovePatients: (patientIds: string[], targetDate: string) => void;
  onCopyPatients: (patientIds: string[], targetDate: string) => void;
  onOpenBookmarksModal: (bookmarkId: string | null) => void;
}

const AppViews: React.FC<AppViewsProps> = ({
  viewMode,
  currentDate,
  records,
  patientTypes,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onGenerateReport,
  onMovePatients,
  onCopyPatients,
  onOpenBookmarksModal,
}) => {
  if (viewMode === 'daily') {
    return (
      <Suspense fallback={<ViewSkeleton />}>
        <DailyView
          currentDate={currentDate}
          records={records}
          patientTypes={patientTypes}
          onAddPatient={onAddPatient}
          onEditPatient={onEditPatient}
          onDeletePatient={onDeletePatient}
          onGenerateReport={onGenerateReport}
          onMovePatients={onMovePatients}
          onCopyPatients={onCopyPatients}
        />
      </Suspense>
    );
  }

  if (viewMode === 'history') {
    return (
      <Suspense fallback={<HistorySkeleton />}>
        <PatientsHistoryView />
      </Suspense>
    );
  }

  if (viewMode === 'stats') {
    return (
      <Suspense fallback={<StatsSkeleton />}>
        <StatsView currentDate={currentDate} />
      </Suspense>
    );
  }

  if (viewMode === 'tasks') {
    return (
      <Suspense fallback={<TasksSkeleton />}>
        <TaskDashboard onNavigateToPatient={onEditPatient} />
      </Suspense>
    );
  }

  if (viewMode === 'bookmarks') {
    return (
      <Suspense fallback={<BookmarksSkeleton />}>
        <BookmarksView
          onAdd={() => onOpenBookmarksModal(null)}
          onEdit={(bookmarkId) => onOpenBookmarksModal(bookmarkId)}
        />
      </Suspense>
    );
  }

  if (viewMode === 'settings') {
    return (
      <Suspense fallback={<SettingsSkeleton />}>
        <Settings />
      </Suspense>
    );
  }

  return null;
};

export default AppViews;

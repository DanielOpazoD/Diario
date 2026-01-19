import React, { Suspense, lazy } from 'react';
import { format } from 'date-fns';
import { PatientRecord, ViewMode } from '../types';
import { ModalSkeleton } from './LoadingSkeletons';

const PatientModal = lazy(() => import('./PatientModal'));
const ConfirmationModal = lazy(() => import('./ConfirmationModal'));
const BookmarksModal = lazy(() => import('./BookmarksModal'));
const AppMenuModal = lazy(() => import('./AppMenuModal'));

interface AppModalsProps {
  currentDate: Date;
  isPatientModalOpen: boolean;
  editingPatient: PatientRecord | null;
  patientToDelete: string | null;
  isBookmarksModalOpen: boolean;
  editingBookmarkId: string | null;
  isAppMenuOpen: boolean;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onClosePatientModal: () => void;
  onSavePatient: (patientData: Omit<PatientRecord, 'id' | 'createdAt'> | PatientRecord) => void;
  onSaveMultiplePatients: (patientsData: Array<Omit<PatientRecord, 'id' | 'createdAt'>>) => void;
  onCloseDeleteConfirmation: () => void;
  onConfirmDelete: () => void;
  onCloseBookmarksModal: () => void;
  onCloseAppMenu: () => void;
  onNavigate: (view: ViewMode) => void;
}

const AppModals: React.FC<AppModalsProps> = ({
  currentDate,
  isPatientModalOpen,
  editingPatient,
  patientToDelete,
  isBookmarksModalOpen,
  editingBookmarkId,
  onToast,
  onClosePatientModal,
  onSavePatient,
  onSaveMultiplePatients,
  onCloseDeleteConfirmation,
  onConfirmDelete,
  onCloseBookmarksModal,
  onCloseAppMenu,
  onNavigate,
  isAppMenuOpen,
}) => (
  <>
    {isPatientModalOpen && (
      <Suspense fallback={<ModalSkeleton />}>
        <PatientModal
          isOpen={isPatientModalOpen}
          onClose={onClosePatientModal}
          onSave={onSavePatient}
          onSaveMultiple={onSaveMultiplePatients}
          addToast={onToast}
          initialData={editingPatient}
          selectedDate={format(currentDate, 'yyyy-MM-dd')}
        />
      </Suspense>
    )}

    {patientToDelete && (
      <Suspense fallback={null}>
        <ConfirmationModal
          isOpen={!!patientToDelete}
          onClose={onCloseDeleteConfirmation}
          onConfirm={onConfirmDelete}
          title="Eliminar Paciente"
          message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
          isDangerous={true}
        />
      </Suspense>
    )}

    {isBookmarksModalOpen && (
      <Suspense fallback={<ModalSkeleton />}>
        <BookmarksModal
          isOpen={isBookmarksModalOpen}
          onClose={onCloseBookmarksModal}
          editingBookmarkId={editingBookmarkId}
        />
      </Suspense>
    )}

    {isAppMenuOpen && (
      <Suspense fallback={<ModalSkeleton />}>
        <AppMenuModal
          isOpen={isAppMenuOpen}
          onClose={onCloseAppMenu}
          onNavigate={onNavigate}
        />
      </Suspense>
    )}
  </>
);

export default AppModals;

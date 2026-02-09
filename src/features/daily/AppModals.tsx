import React, { Suspense, lazy } from 'react';
import { PatientCreateInput, PatientRecord, PatientUpdateInput, ViewMode } from '@shared/types';
import { formatLocalYMD } from '@shared/utils/dateUtils';
import { ModalSkeleton } from '@core/ui';

const PatientModal = lazy(() => import('@core/patient/components/PatientModal'));
const PatientHistoryModal = lazy(() => import('@core/patient/components/PatientHistoryModal'));
const ConfirmationModal = lazy(() => import('@core/ui').then(m => ({ default: m.ConfirmationModal })));
const BookmarksModal = lazy(() => import('@features/bookmarks/BookmarksModal'));
const AppMenuModal = lazy(() => import('./AppMenuModal'));

interface AppModalsProps {
  currentDate: Date;
  isPatientModalOpen: boolean;
  editingPatient: PatientRecord | null;
  initialTab?: 'clinical' | 'files';
  patientToDelete: string | null;
  isBookmarksModalOpen: boolean;
  editingBookmarkId: string | null;
  isAppMenuOpen: boolean;
  patientModalMode?: 'daily' | 'history';
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onClosePatientModal: () => void;
  onSavePatient: (patientData: PatientCreateInput | PatientUpdateInput) => void;
  onAutoSavePatient: (patientData: PatientCreateInput | PatientUpdateInput) => void;
  onSaveMultiplePatients: (patientsData: PatientCreateInput[]) => void;
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
  onAutoSavePatient,
  onSaveMultiplePatients,
  onCloseDeleteConfirmation,
  onConfirmDelete,
  onCloseBookmarksModal,
  onCloseAppMenu,
  onNavigate,
  isAppMenuOpen,
  initialTab,
  patientModalMode = 'daily',
}) => {
  const selectedDate = formatLocalYMD(currentDate);

  return (
    <>
      {isPatientModalOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          {patientModalMode === 'history' ? (
            <PatientHistoryModal
              isOpen={isPatientModalOpen}
              onClose={onClosePatientModal}
              record={editingPatient}
              initialTab={initialTab}
            />
          ) : (
            <PatientModal
              isOpen={isPatientModalOpen}
              onClose={onClosePatientModal}
              onSave={onSavePatient}
              onAutoSave={onAutoSavePatient}
              onSaveMultiple={onSaveMultiplePatients}
              addToast={onToast}
              initialData={editingPatient}
              selectedDate={selectedDate}
              initialTab={initialTab}
              mode={patientModalMode}
            />
          )}
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
};

export default AppModals;

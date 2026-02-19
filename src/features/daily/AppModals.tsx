import React, { Suspense, lazy } from 'react';
import { formatLocalYMD } from '@shared/utils/dateUtils';
import { ModalSkeleton } from '@core/ui';
import { useCurrentDate, useModalState } from '@core/app/state/useAppState';
import { useAppActions } from '@core/app/state/useAppActions';
import { usePatientCrud } from '@core/patient';

const PatientModal = lazy(() => import('@core/patient/components/PatientModal'));
const PatientHistoryModal = lazy(() => import('@core/patient/components/PatientHistoryModal'));
const ConfirmationModal = lazy(() => import('@core/ui').then(m => ({ default: m.ConfirmationModal })));
const BookmarksModal = lazy(() => import('@features/bookmarks/BookmarksModal'));
const AppMenuModal = lazy(() => import('./AppMenuModal'));

const AppModals: React.FC = () => {
  const currentDate = useCurrentDate();
  const {
    isPatientModalOpen,
    editingPatient,
    patientToDelete,
    isBookmarksModalOpen,
    editingBookmarkId,
    isAppMenuOpen,
    initialTab,
    patientModalMode
  } = useModalState();

  const {
    addToast,
    closePatientModal,
    closeDeleteConfirmation,
    closeBookmarksModal,
    closeAppMenu,
  } = useAppActions();

  const {
    handleSavePatient,
    handleAutoSavePatient,
    handleSaveMultiplePatients,
    confirmDeletePatient,
  } = usePatientCrud();

  const selectedDate = formatLocalYMD(currentDate);

  return (
    <>
      {isPatientModalOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          {patientModalMode === 'history' ? (
            <PatientHistoryModal
              isOpen={isPatientModalOpen}
              onClose={closePatientModal}
              record={editingPatient}
              initialTab={initialTab}
            />
          ) : (
            <PatientModal
              isOpen={isPatientModalOpen}
              onClose={closePatientModal}
              onSave={handleSavePatient}
              onAutoSave={handleAutoSavePatient}
              onSaveMultiple={handleSaveMultiplePatients}
              addToast={addToast}
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
            onClose={closeDeleteConfirmation}
            onConfirm={confirmDeletePatient}
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
            onClose={closeBookmarksModal}
            editingBookmarkId={editingBookmarkId}
          />
        </Suspense>
      )}

      {isAppMenuOpen && (
        <Suspense fallback={<ModalSkeleton />}>
          <AppMenuModal
            isOpen={isAppMenuOpen}
            onClose={closeAppMenu}
          />
        </Suspense>
      )}
    </>
  );
};

export default AppModals;

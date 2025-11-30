import React, { Suspense, lazy } from 'react';
import { format } from 'date-fns';
import { DriveFolderPreference, PatientRecord } from '../types';
import { ModalSkeleton } from './LoadingSkeletons';

const PatientModal = lazy(() => import('./PatientModal'));
const ConfirmationModal = lazy(() => import('./ConfirmationModal'));
const BackupModal = lazy(() => import('./BackupModal'));
const DrivePickerModal = lazy(() => import('./DrivePickerModal'));
const BookmarksModal = lazy(() => import('./BookmarksModal'));

interface AppModalsProps {
  currentDate: Date;
  isPatientModalOpen: boolean;
  editingPatient: PatientRecord | null;
  patientToDelete: string | null;
  isBackupModalOpen: boolean;
  isDrivePickerOpen: boolean;
  isBookmarksModalOpen: boolean;
  editingBookmarkId: string | null;
  isUploading: boolean;
  preferredFolder: DriveFolderPreference;
  onToast: (type: 'success' | 'error' | 'info', message: string) => void;
  onClosePatientModal: () => void;
  onSavePatient: (patientData: any) => void;
  onSaveMultiplePatients: (patientsData: any[]) => void;
  onCloseDeleteConfirmation: () => void;
  onConfirmDelete: () => void;
  onCloseBackupModal: () => void;
  onConfirmBackup: (fileName: string, folder: DriveFolderPreference) => void;
  onCloseDrivePicker: () => void;
  onSelectDriveFile: (fileId: string) => void;
  onFolderChange: (folder: DriveFolderPreference) => void;
  onCloseBookmarksModal: () => void;
}

const AppModals: React.FC<AppModalsProps> = ({
  currentDate,
  isPatientModalOpen,
  editingPatient,
  patientToDelete,
  isBackupModalOpen,
  isDrivePickerOpen,
  isBookmarksModalOpen,
  editingBookmarkId,
  isUploading,
  preferredFolder,
  onToast,
  onClosePatientModal,
  onSavePatient,
  onSaveMultiplePatients,
  onCloseDeleteConfirmation,
  onConfirmDelete,
  onCloseBackupModal,
  onConfirmBackup,
  onCloseDrivePicker,
  onSelectDriveFile,
  onFolderChange,
  onCloseBookmarksModal,
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

    {isBackupModalOpen && (
      <Suspense fallback={<ModalSkeleton />}>
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={onCloseBackupModal}
          onConfirm={onConfirmBackup}
          defaultFileName={`backup_medidiario_${format(new Date(), 'yyyy-MM-dd')}`}
          isLoading={isUploading}
          preferredFolder={preferredFolder}
          onFolderChange={onFolderChange}
        />
      </Suspense>
    )}

    {isDrivePickerOpen && (
      <Suspense fallback={<ModalSkeleton />}>
        <DrivePickerModal
          isOpen={isDrivePickerOpen}
          onClose={onCloseDrivePicker}
          onSelect={onSelectDriveFile}
          isLoadingProp={isUploading}
          preferredFolder={preferredFolder}
          onFolderChange={onFolderChange}
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
  </>
);

export default AppModals;

import { useCallback, useState } from 'react';
import { PatientRecord } from '../shared/types/index.ts';

const useModalManager = () => {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);

  const openNewPatientModal = useCallback(() => {
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  }, []);

  const openEditPatientModal = useCallback((patient: PatientRecord) => {
    setEditingPatient(patient);
    setIsPatientModalOpen(true);
  }, []);

  const closePatientModal = useCallback(() => {
    setIsPatientModalOpen(false);
    setEditingPatient(null);
  }, []);

  const requestDeletePatient = useCallback((patientId: string) => {
    setPatientToDelete(patientId);
  }, []);

  const closeDeleteConfirmation = useCallback(() => {
    setPatientToDelete(null);
  }, []);

  const openBackupModal = useCallback(() => setIsBackupModalOpen(true), []);
  const closeBackupModal = useCallback(() => setIsBackupModalOpen(false), []);

  const openDrivePicker = useCallback(() => setIsDrivePickerOpen(true), []);
  const closeDrivePicker = useCallback(() => setIsDrivePickerOpen(false), []);

  const openBookmarksModal = useCallback((bookmarkId: string | null = null) => {
    setEditingBookmarkId(bookmarkId);
    setIsBookmarksModalOpen(true);
  }, []);

  const closeBookmarksModal = useCallback(() => {
    setEditingBookmarkId(null);
    setIsBookmarksModalOpen(false);
  }, []);

  return {
    isPatientModalOpen,
    editingPatient,
    patientToDelete,
    isBackupModalOpen,
    isDrivePickerOpen,
    isBookmarksModalOpen,
    editingBookmarkId,
    openNewPatientModal,
    openEditPatientModal,
    closePatientModal,
    requestDeletePatient,
    closeDeleteConfirmation,
    openBackupModal,
    closeBackupModal,
    openDrivePicker,
    closeDrivePicker,
    openBookmarksModal,
    closeBookmarksModal,
    setEditingPatient,
    setPatientToDelete,
  } as const;
};

export default useModalManager;

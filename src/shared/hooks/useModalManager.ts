import { useCallback, useState } from 'react';
import { PatientRecord } from '@shared/types';

const useModalManager = () => {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<'clinical' | 'files' | undefined>(undefined);
  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [patientModalMode, setPatientModalMode] = useState<'daily' | 'history'>('daily');

  const openNewPatientModal = useCallback(() => {
    setPatientModalMode('daily');
    setIsPatientModalOpen(true);
  }, []);

  const openEditPatientModal = useCallback((
    patient: PatientRecord,
    tab?: 'clinical' | 'files',
    mode: 'daily' | 'history' = 'daily',
  ) => {
    setEditingPatient(patient);
    setInitialTab(tab);
    setPatientModalMode(mode);
    setIsPatientModalOpen(true);
  }, []);

  const closePatientModal = useCallback(() => {
    setEditingPatient(null);
    setInitialTab(undefined);
    setPatientModalMode('daily');
    setIsPatientModalOpen(false);
  }, []);

  const requestDeletePatient = useCallback((id: string) => setPatientToDelete(id), []);

  const closeDeleteConfirmation = useCallback(() => {
    setPatientToDelete(null);
  }, []);

  const openBookmarksModal = useCallback((bookmarkId: string | null = null) => {
    setEditingBookmarkId(bookmarkId);
    setIsBookmarksModalOpen(true);
  }, []);

  const closeBookmarksModal = useCallback(() => {
    setIsBookmarksModalOpen(false);
    setEditingBookmarkId(null);
  }, []);

  const openAppMenu = useCallback(() => setIsAppMenuOpen(true), []);
  const closeAppMenu = useCallback(() => setIsAppMenuOpen(false), []);

  return {
    isPatientModalOpen,
    editingPatient,
    patientToDelete,
    isBookmarksModalOpen,
    editingBookmarkId,
    isAppMenuOpen,
    openNewPatientModal,
    openEditPatientModal,
    closePatientModal,
    requestDeletePatient,
    closeDeleteConfirmation,
    openBookmarksModal,
    closeBookmarksModal,
    openAppMenu,
    closeAppMenu,
    setEditingPatient,
    setPatientToDelete,
    initialTab,
    patientModalMode,
  } as const;
};

export default useModalManager;

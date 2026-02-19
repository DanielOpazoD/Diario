import type { StateCreator } from 'zustand';
import { PatientRecord } from '@shared/types';

export interface NavigationSlice {
    // Date Navigation
    currentDate: Date;
    setCurrentDate: (date: Date) => void;

    // Modals State
    isPatientModalOpen: boolean;
    editingPatient: PatientRecord | null;
    patientToDelete: string | null;
    initialTab: 'clinical' | 'files' | undefined;
    isBookmarksModalOpen: boolean;
    editingBookmarkId: string | null;
    isAppMenuOpen: boolean;
    patientModalMode: 'daily' | 'history';

    // Modal Actions
    openNewPatientModal: () => void;
    openEditPatientModal: (patient: PatientRecord, tab?: 'clinical' | 'files', mode?: 'daily' | 'history') => void;
    closePatientModal: () => void;
    requestDeletePatient: (id: string) => void;
    closeDeleteConfirmation: () => void;
    openBookmarksModal: (bookmarkId?: string | null) => void;
    closeBookmarksModal: () => void;
    openAppMenu: () => void;
    closeAppMenu: () => void;
}

export const createNavigationSlice: StateCreator<NavigationSlice> = (set) => ({
    currentDate: new Date(),
    setCurrentDate: (date) => set({ currentDate: date }),

    isPatientModalOpen: false,
    editingPatient: null,
    patientToDelete: null,
    initialTab: undefined,
    isBookmarksModalOpen: false,
    editingBookmarkId: null,
    isAppMenuOpen: false,
    patientModalMode: 'daily',

    openNewPatientModal: () => set({
        patientModalMode: 'daily',
        isPatientModalOpen: true,
        editingPatient: null,
        initialTab: undefined
    }),

    openEditPatientModal: (patient, tab, mode = 'daily') => set({
        editingPatient: patient,
        initialTab: tab,
        patientModalMode: mode,
        isPatientModalOpen: true
    }),

    closePatientModal: () => set({
        editingPatient: null,
        initialTab: undefined,
        patientModalMode: 'daily',
        isPatientModalOpen: false
    }),

    requestDeletePatient: (id) => set({ patientToDelete: id }),

    closeDeleteConfirmation: () => set({ patientToDelete: null }),

    openBookmarksModal: (bookmarkId = null) => set({
        editingBookmarkId: bookmarkId,
        isBookmarksModalOpen: true
    }),

    closeBookmarksModal: () => set({
        isBookmarksModalOpen: false,
        editingBookmarkId: null
    }),

    openAppMenu: () => set({ isAppMenuOpen: true }),
    closeAppMenu: () => set({ isAppMenuOpen: false }),
});

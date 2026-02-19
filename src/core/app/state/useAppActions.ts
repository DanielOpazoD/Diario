import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';

export const useAppActions = () => useAppStore(useShallow(state => ({
  logout: state.logout,
  addToast: state.addToast,
  setRecords: state.setRecords,
  setGeneralTasks: state.setGeneralTasks,
  addPatient: state.addPatient,
  updatePatient: state.updatePatient,
  deletePatient: state.deletePatient,
  setBookmarks: state.setBookmarks,
  setBookmarkCategories: state.setBookmarkCategories,
  setPatientTypes: state.setPatientTypes,
  setCurrentDate: state.setCurrentDate,
  openNewPatientModal: state.openNewPatientModal,
  openEditPatientModal: state.openEditPatientModal,
  closePatientModal: state.closePatientModal,
  requestDeletePatient: state.requestDeletePatient,
  closeDeleteConfirmation: state.closeDeleteConfirmation,
  openBookmarksModal: state.openBookmarksModal,
  closeBookmarksModal: state.closeBookmarksModal,
  openAppMenu: state.openAppMenu,
  closeAppMenu: state.closeAppMenu,
})));


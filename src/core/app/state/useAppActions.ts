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
})));

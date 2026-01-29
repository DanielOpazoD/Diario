import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';

export const useAppState = () => useAppStore(useShallow(state => ({
  user: state.user,
  records: state.records,
  generalTasks: state.generalTasks,
  patientTypes: state.patientTypes,
  bookmarks: state.bookmarks,
  bookmarkCategories: state.bookmarkCategories,
  showBookmarkBar: state.showBookmarkBar,
  securityPin: state.securityPin,
  autoLockMinutes: state.autoLockMinutes,
})));

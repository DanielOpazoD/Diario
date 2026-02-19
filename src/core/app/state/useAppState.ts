import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';

export const useUser = () => useAppStore(state => state.user);
export const useRecords = () => useAppStore(state => state.records);
export const useGeneralTasks = () => useAppStore(state => state.generalTasks);
export const usePatientTypes = () => useAppStore(state => state.patientTypes);
export const useBookmarks = () => useAppStore(state => state.bookmarks);
export const useBookmarkCategories = () => useAppStore(state => state.bookmarkCategories);
export const useShowBookmarkBar = () => useAppStore(state => state.showBookmarkBar);
export const useSecurityConfig = () => useAppStore(useShallow(state => ({
  securityPinHash: state.securityPinHash,
  securityPinSalt: state.securityPinSalt,
  autoLockMinutes: state.autoLockMinutes,
})));

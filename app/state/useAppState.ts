import useAppStore from '../../stores/useAppStore';

export const useAppState = () => {
  const user = useAppStore(state => state.user);
  const records = useAppStore(state => state.records);
  const generalTasks = useAppStore(state => state.generalTasks);
  const patientTypes = useAppStore(state => state.patientTypes);
  const bookmarks = useAppStore(state => state.bookmarks);
  const bookmarkCategories = useAppStore(state => state.bookmarkCategories);
  const showBookmarkBar = useAppStore(state => state.showBookmarkBar);
  const securityPin = useAppStore(state => state.securityPin);
  const autoLockMinutes = useAppStore(state => state.autoLockMinutes);

  return {
    user,
    records,
    generalTasks,
    patientTypes,
    bookmarks,
    bookmarkCategories,
    showBookmarkBar,
    securityPin,
    autoLockMinutes,
  };
};

import useAppStore from '../../../stores/useAppStore';

const useBookmarks = () => {
  const {
    bookmarks,
    bookmarkCategories,
    setBookmarks,
    setBookmarkCategories,
  } = useAppStore(state => ({
    bookmarks: state.bookmarks,
    bookmarkCategories: state.bookmarkCategories,
    setBookmarks: state.setBookmarks,
    setBookmarkCategories: state.setBookmarkCategories,
  }));

  return {
    bookmarks,
    bookmarkCategories,
    setBookmarks,
    setBookmarkCategories,
  };
};

export default useBookmarks;

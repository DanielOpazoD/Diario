import useAppStore from '../../../stores/useAppStore';

export const useBookmarks = () => {
  const {
    bookmarks,
    bookmarkCategories,
    showBookmarkBar,
    setShowBookmarkBar,
    updateBookmark,
    deleteBookmark,
    updateBookmarkCategory,
    deleteBookmarkCategory,
    addBookmarkCategory,
    setBookmarks,
    setBookmarkCategories,
    addToast,
  } = useAppStore();

  return {
    bookmarks,
    bookmarkCategories,
    showBookmarkBar,
    setShowBookmarkBar,
    updateBookmark,
    deleteBookmark,
    updateBookmarkCategory,
    deleteBookmarkCategory,
    addBookmarkCategory,
    setBookmarks,
    setBookmarkCategories,
    addToast,
  } as const;
};

export default useBookmarks;

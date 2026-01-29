import { StateCreator } from 'zustand';
import { Bookmark, BookmarkCategory } from '@shared/types';
import { defaultBookmarkCategories, resolveBookmarkTitle } from '@domain/bookmarks';

export interface BookmarksSlice {
  bookmarks: Bookmark[];
  bookmarkCategories: BookmarkCategory[];
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setBookmarkCategories: (categories: BookmarkCategory[]) => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'order'>) => void;
  updateBookmark: (id: string, data: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  reorderBookmarks: (bookmarks: Bookmark[]) => void;
  addBookmarkCategory: (category: Omit<BookmarkCategory, 'id'>) => void;
  updateBookmarkCategory: (id: string, data: Partial<BookmarkCategory>) => void;
  deleteBookmarkCategory: (id: string) => void;
}

export const createBookmarkSlice: StateCreator<BookmarksSlice> = (set) => ({
  bookmarks: [],
  bookmarkCategories: defaultBookmarkCategories,

  setBookmarks: (bookmarks) =>
    set({
      bookmarks: bookmarks.map((bookmark, index) => ({
        ...bookmark,
        order: typeof bookmark.order === 'number' ? bookmark.order : index,
      })),
    }),

  setBookmarkCategories: (categories) => set({ bookmarkCategories: categories }),

  addBookmark: (data) =>
    set((state) => {
      const newBookmark: Bookmark = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        order: state.bookmarks.length,
        title: resolveBookmarkTitle(data.title, data.url),
      };
      return { bookmarks: [...state.bookmarks, newBookmark] };
    }),

  updateBookmark: (id, data) =>
    set((state) => ({
      bookmarks: state.bookmarks.map((bookmark) =>
        bookmark.id === id
          ? {
              ...bookmark,
              ...data,
              title:
                data.title !== undefined
                  ? resolveBookmarkTitle(data.title, data.url ?? bookmark.url)
                  : bookmark.title,
            }
          : bookmark
      ),
    })),

  deleteBookmark: (id) =>
    set((state) => {
      const filtered = state.bookmarks.filter((bookmark) => bookmark.id !== id);
      return {
        bookmarks: filtered.map((bookmark, index) => ({ ...bookmark, order: index })),
      };
    }),

  reorderBookmarks: (bookmarks) =>
    set({ bookmarks: bookmarks.map((bookmark, index) => ({ ...bookmark, order: index })) }),

  addBookmarkCategory: (category) =>
    set((state) => ({
      bookmarkCategories: [...state.bookmarkCategories, { ...category, id: crypto.randomUUID() }],
    })),

  updateBookmarkCategory: (id, data) =>
    set((state) => ({
      bookmarkCategories: state.bookmarkCategories.map((category) =>
        category.id === id ? { ...category, ...data } : category
      ),
    })),

  deleteBookmarkCategory: (id) =>
    set((state) => {
      if (id === 'default') return state;

      const remainingCategories = state.bookmarkCategories.filter((category) => category.id !== id);
      const fallbackCategory = remainingCategories.find((category) => category.id === 'default') || defaultBookmarkCategories[0];

      return {
        bookmarkCategories: remainingCategories,
        bookmarks: state.bookmarks.map((bookmark) =>
          (bookmark.categoryId || 'default') === id
            ? { ...bookmark, categoryId: fallbackCategory.id }
            : bookmark
        ),
      };
    }),
});

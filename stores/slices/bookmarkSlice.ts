import { StateCreator } from 'zustand';
import { Bookmark, BookmarkCategory } from '../../types';

export interface BookmarkSlice {
  bookmarks: Bookmark[];
  categories: BookmarkCategory[];
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'order'>) => void;
  updateBookmark: (id: string, data: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  reorderBookmarks: (bookmarks: Bookmark[]) => void;
  addCategory: (category: Omit<BookmarkCategory, 'id'>) => void;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setCategories: (categories: BookmarkCategory[]) => void;
}

const normalizeOrders = (bookmarks: Bookmark[]) =>
  bookmarks.map((bookmark, index) => ({ ...bookmark, order: index }));

const getTitleFallback = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
};

export const createBookmarksSlice: StateCreator<BookmarkSlice> = (set) => ({
  bookmarks: [],
  categories: [
    {
      id: 'default',
      name: 'General',
      icon: 'Bookmark',
      color: 'blue'
    }
  ],

  addBookmark: (data) =>
    set((state) => {
      const order = state.bookmarks.length;
      const bookmark: Bookmark = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        order,
        title: data.title ?? getTitleFallback(data.url)
      };

      return { bookmarks: [...state.bookmarks, bookmark] };
    }),

  updateBookmark: (id, data) =>
    set((state) => ({
      bookmarks: state.bookmarks.map((bookmark) => {
        if (bookmark.id !== id) return bookmark;
        const nextTitle = data.title !== undefined ? data.title : bookmark.title;
        return {
          ...bookmark,
          ...data,
          title: nextTitle ?? getTitleFallback(data.url || bookmark.url)
        };
      })
    })),

  deleteBookmark: (id) =>
    set((state) => ({
      bookmarks: normalizeOrders(
        state.bookmarks
          .filter((bookmark) => bookmark.id !== id)
          .sort((a, b) => a.order - b.order)
      )
    })),

  reorderBookmarks: (bookmarks) => set({ bookmarks: normalizeOrders(bookmarks) }),

  addCategory: (data) =>
    set((state) => ({
      categories: [...state.categories, { ...data, id: crypto.randomUUID() }]
    })),

  setBookmarks: (bookmarks) =>
    set({ bookmarks: normalizeOrders([...bookmarks].sort((a, b) => a.order - b.order)) }),

  setCategories: (categories) => set({ categories })
});

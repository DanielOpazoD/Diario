import { useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import { Bookmark, BookmarkCategory } from '@shared/types';
import { buildBookmarksExport, parseBookmarksImport } from '@use-cases/bookmarks';

export interface BookmarkFilters {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  filteredBookmarks: Bookmark[];
  resolveCategory: (categoryId?: string) => BookmarkCategory;
  handleRenameCategory: (categoryId: string, currentName: string) => void;
  handleDeleteCategory: (categoryId: string) => void;
  handleExport: () => void;
  handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  importInputRef: React.RefObject<HTMLInputElement>;
  showBookmarkBar: boolean;
  setShowBookmarkBar: (value: boolean) => void;
  bookmarkCategories: BookmarkCategory[];
  updateBookmark: (id: string, data: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  addBookmarkCategory: (payload: { name: string }) => void;
}

export const useBookmarksManager = (): BookmarkFilters => {
  const {
    bookmarks,
    bookmarkCategories,
    updateBookmark,
    deleteBookmark,
    updateBookmarkCategory,
    deleteBookmarkCategory,
    addBookmarkCategory,
    setBookmarks,
    setBookmarkCategories,
    showBookmarkBar,
    setShowBookmarkBar,
    addToast,
  } = useAppStore(useShallow(state => ({
    bookmarks: state.bookmarks,
    bookmarkCategories: state.bookmarkCategories,
    updateBookmark: state.updateBookmark,
    deleteBookmark: state.deleteBookmark,
    updateBookmarkCategory: state.updateBookmarkCategory,
    deleteBookmarkCategory: state.deleteBookmarkCategory,
    addBookmarkCategory: state.addBookmarkCategory,
    setBookmarks: state.setBookmarks,
    setBookmarkCategories: state.setBookmarkCategories,
    showBookmarkBar: state.showBookmarkBar,
    setShowBookmarkBar: state.setShowBookmarkBar,
    addToast: state.addToast,
  })));

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const filteredBookmarks = useMemo(() => {
    return [...bookmarks]
      .sort((a, b) => a.order - b.order)
      .filter(bookmark => {
        const matchesSearch =
          bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bookmark.note || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          categoryFilter === 'all' || (bookmark.categoryId || 'default') === categoryFilter;
        return matchesSearch && matchesCategory;
      });
  }, [bookmarks, categoryFilter, searchTerm]);

  const resolveCategory = useCallback(
    (categoryId?: string) =>
      bookmarkCategories.find(category => category.id === categoryId) || bookmarkCategories[0],
    [bookmarkCategories],
  );

  const handleRenameCategory = useCallback(
    (categoryId: string, currentName: string) => {
      const name = prompt('Nuevo nombre de la categoría', currentName);
      if (!name) return;
      updateBookmarkCategory(categoryId, { name });
    },
    [updateBookmarkCategory],
  );

  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      if (categoryId === 'default') return;
      const confirmed = confirm('¿Eliminar esta categoría? Los marcadores se moverán a "General".');
      if (!confirmed) return;
      deleteBookmarkCategory(categoryId);
    },
    [deleteBookmarkCategory],
  );

  const handleExport = useCallback(() => {
    const { filename, payload } = buildBookmarksExport(bookmarks, bookmarkCategories);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    addToast('success', 'Marcadores exportados');
  }, [addToast, bookmarkCategories, bookmarks]);

  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const { bookmarks: imported, categories } = parseBookmarksImport(text, bookmarkCategories);
        setBookmarkCategories(categories);
        setBookmarks(imported);
        addToast('success', 'Marcadores importados correctamente');
      } catch (error) {
        console.error('Error al importar marcadores', error);
        addToast('error', 'No se pudo importar el archivo. Verifica el formato JSON.');
      } finally {
        if (importInputRef.current) {
          importInputRef.current.value = '';
        }
      }
    },
    [addToast, bookmarkCategories, setBookmarkCategories, setBookmarks],
  );

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    filteredBookmarks,
    resolveCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleExport,
    handleImportFile,
    importInputRef,
    showBookmarkBar,
    setShowBookmarkBar,
    bookmarkCategories,
    updateBookmark,
    deleteBookmark,
    addBookmarkCategory,
  };
};

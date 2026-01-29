import React, { useEffect, useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useAppStore from '@core/stores/useAppStore';
import { Bookmark } from '@shared/types';
import BookmarkForm, { BookmarkFormState } from '@features/bookmarks/components/BookmarkForm';
import BookmarkList from '@features/bookmarks/components/BookmarkList';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBookmarkId?: string | null;
}

const defaultFormState: BookmarkFormState = {
  title: '',
  url: '',
  icon: '',
  note: '',
  categoryId: 'default',
  isFavorite: true,
};

const BookmarksModal: React.FC<BookmarksModalProps> = ({ isOpen, onClose, editingBookmarkId }) => {
  const {
    bookmarks,
    bookmarkCategories,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    addBookmarkCategory,
  } = useAppStore(useShallow(state => ({
    bookmarks: state.bookmarks,
    bookmarkCategories: state.bookmarkCategories,
    addBookmark: state.addBookmark,
    updateBookmark: state.updateBookmark,
    deleteBookmark: state.deleteBookmark,
    reorderBookmarks: state.reorderBookmarks,
    addBookmarkCategory: state.addBookmarkCategory,
  })));

  const [form, setForm] = useState<BookmarkFormState>(defaultFormState);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(editingBookmarkId || null);

  useEffect(() => {
    setEditingId(editingBookmarkId || null);
  }, [editingBookmarkId]);

  useEffect(() => {
    if (!editingId) {
      setForm(defaultFormState);
      setError(null);
      return;
    }

    const bookmark = bookmarks.find((b) => b.id === editingId);
    if (bookmark) {
      setForm({
        title: bookmark.title,
        url: bookmark.url,
        icon: bookmark.icon || '',
        note: bookmark.note || '',
        categoryId: bookmark.categoryId || 'default',
        isFavorite: !!bookmark.isFavorite,
      });
      setError(null);
    }
  }, [editingId, bookmarks]);

  if (!isOpen) return null;

  const handleClose = () => {
    setForm(defaultFormState);
    setError(null);
    setEditingId(null);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.url.trim()) {
      setError('La URL es obligatoria');
      return;
    }

    try {
      const normalizedUrl = new URL(form.url.trim()).toString();
      const payload: Omit<Bookmark, 'id' | 'createdAt' | 'order'> = {
        title: form.title.trim(),
        url: normalizedUrl,
        icon: form.icon.trim() || undefined,
        note: form.note.trim() || undefined,
        categoryId: form.categoryId || 'default',
        isFavorite: form.isFavorite,
      };

      if (editingId) {
        updateBookmark(editingId, payload);
      } else {
        addBookmark(payload);
      }

      setForm(defaultFormState);
      setError(null);
      setEditingId(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError('URL inválida, verifica el formato (ej: https://ejemplo.cl)');
    }
  };

  const handleAddCategory = () => {
    const name = prompt('Nombre de la categoría');
    if (!name) return;
    addBookmarkCategory({ name });
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setForm({
      title: bookmark.title,
      url: bookmark.url,
      icon: bookmark.icon || '',
      note: bookmark.note || '',
      categoryId: bookmark.categoryId || 'default',
      isFavorite: !!bookmark.isFavorite,
    });
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <BookmarkPlus className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Marcadores favoritos</h3>
              <p className="text-xs text-gray-500">Agrega accesos rápidos a tus recursos clínicos</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
          <BookmarkForm
            form={form}
            editingId={editingId}
            bookmarkCategories={bookmarkCategories}
            error={error}
            setForm={setForm}
            onSubmit={handleSubmit}
            onAddCategory={handleAddCategory}
          />

          <BookmarkList
            bookmarks={bookmarks}
            onReorder={reorderBookmarks}
            onEdit={handleEditBookmark}
            onDelete={deleteBookmark}
          />
        </div>
      </div>
    </div>
  );
};

export default BookmarksModal;

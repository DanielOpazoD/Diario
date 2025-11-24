import React, { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, ExternalLink, GripVertical, Plus, Star, Trash2, X } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import { Bookmark } from '../types';
import BookmarkIconGraphic from './BookmarkIcon';

interface BookmarkFormState {
  title: string;
  url: string;
  icon: string;
  note: string;
  categoryId: string;
  isFavorite: boolean;
}

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

const presetIcons = ['🩺', '💊', '📁', '🧠', '🧪', '📌', '🌐', '⚕️'];

const BookmarksModal: React.FC<BookmarksModalProps> = ({ isOpen, onClose, editingBookmarkId }) => {
  const {
    bookmarks,
    bookmarkCategories,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    addBookmarkCategory,
  } = useAppStore();

  const [form, setForm] = useState<BookmarkFormState>(defaultFormState);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(editingBookmarkId || null);

  const sortedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => a.order - b.order),
    [bookmarks]
  );

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

  const moveBookmark = (id: string, direction: 'up' | 'down') => {
    const index = sortedBookmarks.findIndex((bookmark) => bookmark.id === id);
    if (index < 0) return;

    const newOrder = [...sortedBookmarks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const [removed] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, removed);
    reorderBookmarks(newOrder);
  };

  const handleAddCategory = () => {
    const name = prompt('Nombre de la categoría');
    if (!name) return;
    addBookmarkCategory({ name });
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://portal-clinico.cl"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Título (opcional)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ficha Clínica"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ícono (emoji o URL)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="🧪 o https://.../icon.png"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se intentará usar el favicon del sitio primero. Si no existe, se mostrará el ícono que elijas.
              </p>
              <div className="flex flex-wrap gap-2">
                {presetIcons.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setForm((prev) => ({ ...prev, icon }))}
                    className={`px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${
                      form.icon === icon
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    aria-label={`Usar ícono ${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nota</label>
              <textarea
                value={form.note}
                onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Indicaciones o recordatorios"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-between">
                  Categoría
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Nueva
                  </button>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {bookmarkCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Favorito</label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.isFavorite}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFavorite: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Mostrar en la barra rápida
                </label>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {editingId ? 'Guardar cambios' : 'Agregar marcador'}
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Marcadores guardados</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {sortedBookmarks.length} items
              </span>
            </div>

            {sortedBookmarks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aún no tienes enlaces guardados.</p>
            )}

            <div className="space-y-3">
              {sortedBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-2 w-10 justify-center text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    {bookmark.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-300/60" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BookmarkIconGraphic bookmark={bookmark} sizeClass="w-5 h-5" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {bookmark.title}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{bookmark.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveBookmark(bookmark.id, 'up')}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveBookmark(bookmark.id, 'down')}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
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
                          }}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          title="Editar"
                        >
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBookmark(bookmark.id)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {bookmark.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{bookmark.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarksModal;

import React, { useMemo, useState } from 'react';
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  Pencil,
  Plus,
  Star,
  Trash2,
  MoveUp,
  MoveDown,
  StickyNote
} from 'lucide-react';
import useAppStore from '../../stores/useAppStore';
import { Bookmark } from '../../types';
import BookmarksModal from '../../components/BookmarksModal';

const BookmarksView: React.FC = () => {
  const {
    bookmarks,
    categories,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    addCategory
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>();
  const [search, setSearch] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const orderedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  const filteredBookmarks = useMemo(() => {
    if (!search) return orderedBookmarks;
    return orderedBookmarks.filter((bookmark) => {
      const haystack = `${bookmark.title} ${bookmark.url} ${bookmark.note}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [orderedBookmarks, search]);

  const handleSave = (data: Omit<Bookmark, 'id' | 'createdAt' | 'order'>, id?: string) => {
    if (id) {
      updateBookmark(id, data);
    } else {
      addBookmark(data);
    }
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const currentIndex = orderedBookmarks.findIndex((b) => b.id === id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedBookmarks.length) return;

    const updated = [...orderedBookmarks];
    [updated[currentIndex], updated[targetIndex]] = [updated[targetIndex], updated[currentIndex]];
    reorderBookmarks(updated);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory({ name: newCategoryName.trim() });
    setNewCategoryName('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookmarkIcon className="w-6 h-6 text-blue-600" /> Marcadores clínicos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Guarda accesos rápidos a portales y exámenes.</p>
        </div>

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, nota o URL"
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setEditingBookmark(undefined);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo marcador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {filteredBookmarks.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
              Aún no hay marcadores. Agrega enlaces de laboratorio, rayos o ficha clínica.
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">
                    {bookmark.icon || '🔗'}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white break-all hover:text-blue-600"
                    >
                      {bookmark.title || 'Sin título'}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{bookmark.url}</p>
                    {bookmark.note ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-amber-500" /> {bookmark.note}
                      </p>
                    ) : null}
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {categories.find((c) => c.id === bookmark.categoryId)?.name || 'General'}
                      </span>
                      {bookmark.isFavorite ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                          <Star className="w-4 h-4" /> Favorito
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleMove(bookmark.id, 'up')}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Mover arriba"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMove(bookmark.id, 'down')}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Mover abajo"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingBookmark(bookmark);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Categorías</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {cat.icon || '🔖'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{cat.name}</p>
                    {cat.color ? <p className="text-xs text-gray-500">Color: {cat.color}</p> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nueva categoría"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleAddCategory}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                Agregar categoría
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-100">
            Usa marcadores para fijar portales como la ficha oficial, resultados de laboratorio o formularios del hospital.
          </div>
        </div>
      </div>

      <BookmarksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        initialData={editingBookmark}
      />
    </div>
  );
};

export default BookmarksView;

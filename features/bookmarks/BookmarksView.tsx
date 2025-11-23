import React, { useMemo, useState } from 'react';
import { Bookmark, Edit3, ExternalLink, Plus, Search, Star, Trash2 } from 'lucide-react';
import useAppStore from '../../stores/useAppStore';

interface BookmarksViewProps {
  onAdd: () => void;
  onEdit: (bookmarkId: string) => void;
}

const BookmarksView: React.FC<BookmarksViewProps> = ({ onAdd, onEdit }) => {
  const { bookmarks, bookmarkCategories, updateBookmark, deleteBookmark } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredBookmarks = useMemo(() => {
    return [...bookmarks]
      .sort((a, b) => a.order - b.order)
      .filter((bookmark) => {
        const matchesSearch =
          bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          bookmark.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bookmark.note || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          categoryFilter === 'all' || (bookmark.categoryId || 'default') === categoryFilter;
        return matchesSearch && matchesCategory;
      });
  }, [bookmarks, categoryFilter, searchTerm]);

  const resolveCategory = (categoryId?: string) =>
    bookmarkCategories.find((category) => category.id === categoryId) || bookmarkCategories[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marcadores</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Organiza tus accesos rápidos clínicos.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, URL o nota"
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Todas las categorías</option>
            {bookmarkCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredBookmarks.map((bookmark) => {
          const category = resolveCategory(bookmark.categoryId);
          return (
            <div
              key={bookmark.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {bookmark.icon && bookmark.icon.startsWith('http') ? (
                    <img
                      src={bookmark.icon}
                      alt=""
                      className="w-6 h-6 rounded"
                      loading="lazy"
                    />
                  ) : bookmark.icon ? (
                    <span className="text-xl" aria-hidden>
                      {bookmark.icon}
                    </span>
                  ) : (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`}
                      alt=""
                      className="w-6 h-6 rounded"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{bookmark.title}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{bookmark.url}</p>
                    {bookmark.note && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{bookmark.note}</p>
                    )}
                  </div>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {category?.name}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                    <Bookmark className="w-3.5 h-3.5" />
                    Creado: {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateBookmark(bookmark.id, { isFavorite: !bookmark.isFavorite })}
                    className={`p-2 rounded-lg transition-colors ${
                      bookmark.isFavorite
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                    title="Mostrar en la barra"
                  >
                    <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-amber-300/70' : ''}`} />
                  </button>
                  <button
                    onClick={() => window.open(bookmark.url, '_blank', 'noopener,noreferrer')}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Abrir"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(bookmark.id)}
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBookmarks.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No se encontraron marcadores.
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksView;

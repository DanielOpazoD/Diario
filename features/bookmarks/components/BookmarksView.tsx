import React, { useMemo, useRef, useState } from 'react';
import { Bookmark, Edit3, ExternalLink, FileDown, FileUp, LayoutGrid, List, Plus, Search, Star, Trash2 } from 'lucide-react';
import useAppStore from '../../../stores/useAppStore';
import BookmarkIconGraphic from '../../../components/BookmarkIcon';
import { defaultBookmarkCategories } from '../../../stores/slices/bookmarkSlice';

interface BookmarksViewProps {
  onAdd: () => void;
  onEdit: (bookmarkId: string) => void;
}

const BookmarksView: React.FC<BookmarksViewProps> = ({ onAdd, onEdit }) => {
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
  } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleRenameCategory = (categoryId: string, currentName: string) => {
    const name = prompt('Nuevo nombre de la categoría', currentName);
    if (!name) return;
    updateBookmarkCategory(categoryId, { name });
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (categoryId === 'default') return;
    const confirmed = confirm('¿Eliminar esta categoría? Los marcadores se moverán a "General".');
    if (!confirmed) return;
    deleteBookmarkCategory(categoryId);
  };

  const handleExport = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      bookmarks,
      categories: bookmarkCategories,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medidiario_marcadores_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addToast('success', 'Marcadores exportados');
  };

  const ensureDefaultCategory = (categories: typeof bookmarkCategories) => {
    const categoryMap = new Map(categories.map((category) => [category.id, category]));

    defaultBookmarkCategories.forEach((defaultCategory) => {
      if (!categoryMap.has(defaultCategory.id)) {
        categoryMap.set(defaultCategory.id, defaultCategory);
      }
    });

    return Array.from(categoryMap.values());
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const importedBookmarks = Array.isArray(parsed.bookmarks)
        ? parsed.bookmarks
        : Array.isArray(parsed)
          ? parsed
          : [];
      const importedCategories = Array.isArray(parsed.categories) ? parsed.categories : bookmarkCategories;

      const categoriesWithDefault = ensureDefaultCategory(importedCategories);
      const categoryIds = new Set(categoriesWithDefault.map((category) => category.id));

      const sanitizedBookmarks = importedBookmarks.map((bookmark: any, index: number) => ({
        ...bookmark,
        id: bookmark.id || crypto.randomUUID(),
        order: typeof bookmark.order === 'number' ? bookmark.order : index,
        createdAt: typeof bookmark.createdAt === 'number' ? bookmark.createdAt : Date.now(),
        categoryId: categoryIds.has(bookmark.categoryId) ? bookmark.categoryId : 'default',
      }));

      setBookmarkCategories(categoriesWithDefault);
      setBookmarks(sanitizedBookmarks);
      addToast('success', 'Marcadores importados correctamente');
    } catch (error) {
      console.error('Error al importar marcadores', error);
      addToast('error', 'No se pudo importar el archivo. Verifica el formato JSON.');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marcadores</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Organiza tus accesos rápidos clínicos.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <input
                type="file"
                accept="application/json"
                ref={importInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
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
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-900 shadow text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" /> Lista
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-900 shadow text-blue-600 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                  }`}
                  title="Vista de tarjetas"
                >
                  <LayoutGrid className="w-4 h-4" /> Tarjetas
                </button>
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={showBookmarkBar}
                  onChange={(e) => setShowBookmarkBar(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar barra superior
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileUp className="w-4 h-4" /> Importar
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FileDown className="w-4 h-4" /> Exportar
                </button>
              </div>
              <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
              {filteredBookmarks.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">No se encontraron marcadores.</div>
              )}
              {filteredBookmarks.map((bookmark) => {
                const category = resolveCategory(bookmark.categoryId);
                return (
                  <div key={bookmark.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <BookmarkIconGraphic bookmark={bookmark} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{bookmark.title}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{bookmark.url}</p>
                        {bookmark.note && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{bookmark.note}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                            <Bookmark className="w-3.5 h-3.5" /> Creado: {new Date(bookmark.createdAt).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                            {category?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-start sm:self-center">
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
                );
              })}
            </div>
          ) : (
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
                        <BookmarkIconGraphic bookmark={bookmark} />
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
          )}
        </div>

        <aside className="w-full xl:w-80 space-y-3">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categorías</h3>
              <button
                onClick={() => {
                  const name = prompt('Nombre de la nueva categoría');
                  if (name) addBookmarkCategory({ name });
                }}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Plus className="w-3 h-3" /> Nueva
              </button>
            </div>
            <div className="space-y-2">
              {bookmarkCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{category.name}</p>
                    <p className="text-[11px] text-gray-500">ID: {category.id}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRenameCategory(category.id, category.name)}
                      className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                      title="Renombrar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar"
                      disabled={category.id === 'default'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BookmarksView;

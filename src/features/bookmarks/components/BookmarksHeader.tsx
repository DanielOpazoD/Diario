import React, { RefObject } from 'react';
import { FileDown, FileUp, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { BookmarkCategory } from '@shared/types';

interface BookmarksHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    categoryFilter: string;
    setCategoryFilter: (filter: string) => void;
    viewMode: 'list' | 'grid';
    setViewMode: (mode: 'list' | 'grid') => void;
    showBookmarkBar: boolean;
    setShowBookmarkBar: (show: boolean) => void;
    bookmarkCategories: BookmarkCategory[];
    onAdd: () => void;
    onExport: () => void;
    onImportClick: () => void;
    importInputRef: RefObject<HTMLInputElement>;
    handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BookmarksHeader: React.FC<BookmarksHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    showBookmarkBar,
    setShowBookmarkBar,
    bookmarkCategories,
    onAdd,
    onExport,
    onImportClick,
    importInputRef,
    handleImportFile,
}) => {
    return (
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
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list'
                            ? 'bg-white dark:bg-gray-900 shadow text-blue-600 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                            }`}
                        title="Vista de lista"
                    >
                        <List className="w-4 h-4" /> Lista
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid'
                            ? 'bg-white dark:bg-gray-900 shadow text-blue-600 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700'
                            }`}
                        title="Vista de tarjetas"
                    >
                        <LayoutGrid className="w-4 h-4" /> Tarjetas
                    </button>
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 cursor-pointer">
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
                        onClick={onImportClick}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <FileUp className="w-4 h-4" /> Importar
                    </button>
                    <button
                        onClick={onExport}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <FileDown className="w-4 h-4" /> Exportar
                    </button>
                </div>
                <button
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo
                </button>
            </div>
        </div>
    );
};

export default BookmarksHeader;

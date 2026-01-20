import React from 'react';
import { Bookmark as LucideBookmark, Edit3, ExternalLink, Star, Trash2 } from 'lucide-react';
import { Bookmark, BookmarkCategory } from '@shared/types';
import { BookmarkIcon } from '@core/ui';

interface BookmarksListLayoutProps {
    bookmarks: Bookmark[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    resolveCategory: (categoryId?: string) => BookmarkCategory;
}

const BookmarksListLayout: React.FC<BookmarksListLayoutProps> = ({
    bookmarks,
    onEdit,
    onDelete,
    onToggleFavorite,
    resolveCategory,
}) => {
    if (bookmarks.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
                No se encontraron marcadores.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {bookmarks.map((bookmark) => {
                const category = resolveCategory(bookmark.categoryId);
                return (
                    <div key={bookmark.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <BookmarkIcon bookmark={bookmark} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {bookmark.title}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{bookmark.url}</p>
                                {bookmark.note && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                        {bookmark.note}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                        <LucideBookmark className="w-3.5 h-3.5" /> Creado:{' '}
                                        {new Date(bookmark.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                                        {category?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 self-start sm:self-center">
                            <button
                                onClick={() => onToggleFavorite(bookmark.id, !bookmark.isFavorite)}
                                className={`p-2 rounded-lg transition-colors ${bookmark.isFavorite
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
                                onClick={() => onDelete(bookmark.id)}
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
    );
};

export default BookmarksListLayout;

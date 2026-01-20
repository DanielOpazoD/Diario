import React from 'react';
import { Bookmark as LucideBookmark, Edit3, ExternalLink, Star, Trash2 } from 'lucide-react';
import { Bookmark, BookmarkCategory } from '@shared/types';
import { BookmarkIcon } from '@core/ui';

interface BookmarksGridLayoutProps {
    bookmarks: Bookmark[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string, isFavorite: boolean) => void;
    resolveCategory: (categoryId?: string) => BookmarkCategory;
}

const BookmarksGridLayout: React.FC<BookmarksGridLayoutProps> = ({
    bookmarks,
    onEdit,
    onDelete,
    onToggleFavorite,
    resolveCategory,
}) => {
    if (bookmarks.length === 0) {
        return (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-10 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white/50 dark:bg-gray-900/40">
                No se encontraron marcadores.
            </div>
        );
    }

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bookmarks.map((bookmark) => {
                const category = resolveCategory(bookmark.categoryId);
                return (
                    <div
                        key={bookmark.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
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
                                </div>
                            </div>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                {category?.name}
                            </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                                    <LucideBookmark className="w-3.5 h-3.5" />
                                    Creado: {new Date(bookmark.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
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
                    </div>
                );
            })}
        </div>
    );
};

export default BookmarksGridLayout;

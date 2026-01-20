import React from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { BookmarkCategory } from '@shared/types';

interface BookmarksSidebarProps {
    bookmarkCategories: BookmarkCategory[];
    onAddCategory: () => void;
    onRenameCategory: (id: string, currentName: string) => void;
    onDeleteCategory: (id: string) => void;
}

const BookmarksSidebar: React.FC<BookmarksSidebarProps> = ({
    bookmarkCategories,
    onAddCategory,
    onRenameCategory,
    onDeleteCategory,
}) => {
    return (
        <aside className="w-full xl:w-80 space-y-3">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categorías</h3>
                    <button
                        onClick={onAddCategory}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                        <Plus className="w-3 h-3" /> Nueva
                    </button>
                </div>
                <div className="space-y-2">
                    {bookmarkCategories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {category.name}
                                </p>
                                <p className="text-[11px] text-gray-500">ID: {category.id}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onRenameCategory(category.id, category.name)}
                                    className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                                    title="Renombrar"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => onDeleteCategory(category.id)}
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
    );
};

export default BookmarksSidebar;

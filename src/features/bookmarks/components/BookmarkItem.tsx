import React from 'react';
import { BookmarkPlus, ExternalLink, GripVertical, Star, Trash2 } from 'lucide-react';
import { Bookmark } from '@shared/types';
import { BookmarkIcon } from '@core/ui';

interface BookmarkItemProps {
    bookmark: Bookmark;
    isDragging: boolean;
    isDragOver: boolean;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onEdit: (bookmark: Bookmark) => void;
    onDelete: (id: string) => void;
    dragProps: {
        draggable: boolean;
        onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
        onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
        onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
        onDragEnd: () => void;
        onTouchStart: () => void;
        onTouchMove: (event: React.TouchEvent<HTMLDivElement>) => void;
        onTouchEnd: () => void;
    };
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
    bookmark,
    isDragging,
    isDragOver,
    onMove,
    onEdit,
    onDelete,
    dragProps,
}) => {
    return (
        <>
            {isDragOver && !isDragging && (
                <div className="h-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 transition-colors" />
            )}
            <div
                data-bookmark-id={bookmark.id}
                className={`flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 transition-shadow ${isDragging ? 'opacity-60 shadow-lg cursor-grabbing' : 'hover:shadow-md cursor-grab'
                    }`}
                {...dragProps}
            >
                <div className="flex items-center gap-2 w-10 justify-center text-gray-400">
                    <GripVertical className="w-4 h-4" />
                    {bookmark.isFavorite && <Star className="w-4 h-4 text-amber-400 fill-amber-300/60" />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <BookmarkIcon bookmark={bookmark} sizeClass="w-5 h-5" />
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {bookmark.title}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{bookmark.url}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onMove(bookmark.id, 'up')}
                                className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => onMove(bookmark.id, 'down')}
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
                                onClick={() => onEdit(bookmark)}
                                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                title="Editar"
                            >
                                <BookmarkPlus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(bookmark.id)}
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
        </>
    );
};

export default BookmarkItem;

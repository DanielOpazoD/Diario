import React, { useCallback } from 'react';
import { Bookmark } from '@shared/types';
import BookmarkItem from './BookmarkItem';
import { useBookmarkDnD } from '@features/bookmarks/components/hooks/useBookmarkDnD';

interface BookmarkListProps {
    bookmarks: Bookmark[];
    onReorder: (bookmarks: Bookmark[]) => void;
    onEdit: (bookmark: Bookmark) => void;
    onDelete: (id: string) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
    bookmarks,
    onReorder,
    onEdit,
    onDelete,
}) => {
    const sortedBookmarks = React.useMemo(
        () => [...bookmarks].sort((a, b) => a.order - b.order),
        [bookmarks]
    );

    const {
        draggingId,
        dragOverId,
        isTouchDragging,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useBookmarkDnD({ sortedBookmarks, reorderBookmarks: onReorder });

    const moveBookmark = useCallback((id: string, direction: 'up' | 'down') => {
        const index = sortedBookmarks.findIndex((bookmark) => bookmark.id === id);
        if (index < 0) return;

        const newOrder = [...sortedBookmarks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        const [removed] = newOrder.splice(index, 1);
        newOrder.splice(targetIndex, 0, removed);
        onReorder(newOrder);
    }, [onReorder, sortedBookmarks]);

    return (
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
                    <BookmarkItem
                        key={bookmark.id}
                        bookmark={bookmark}
                        isDragging={draggingId === bookmark.id}
                        isDragOver={dragOverId === bookmark.id}
                        onMove={moveBookmark}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        dragProps={{
                            draggable: !isTouchDragging,
                            onDragStart: (event) => handleDragStart(event, bookmark.id),
                            onDragOver: (event) => handleDragOver(event, bookmark.id),
                            onDrop: (event) => handleDrop(event, bookmark.id),
                            onDragEnd: handleDragEnd,
                            onTouchStart: () => handleTouchStart(bookmark.id),
                            onTouchMove: handleTouchMove,
                            onTouchEnd: handleTouchEnd,
                        }}
                    />
                ))}
                {draggingId && dragOverId === null && (
                    <div className="h-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20" />
                )}
            </div>
        </div>
    );
};

export default BookmarkList;

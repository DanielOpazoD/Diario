import { useState } from 'react';
import { Bookmark } from '@shared/types';

interface UseBookmarkDnDProps {
    sortedBookmarks: Bookmark[];
    reorderBookmarks: (bookmarks: Bookmark[]) => void;
}

export const useBookmarkDnD = ({ sortedBookmarks, reorderBookmarks }: UseBookmarkDnDProps) => {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [isTouchDragging, setIsTouchDragging] = useState(false);

    const applyReorder = (sourceId: string, targetId: string) => {
        if (sourceId === targetId) return;

        const currentOrder = [...sortedBookmarks];
        const sourceIndex = currentOrder.findIndex((bookmark) => bookmark.id === sourceId);
        const targetIndex = currentOrder.findIndex((bookmark) => bookmark.id === targetId);

        if (sourceIndex === -1 || targetIndex === -1) return;

        const [removed] = currentOrder.splice(sourceIndex, 1);
        currentOrder.splice(targetIndex, 0, removed);
        reorderBookmarks(currentOrder);
    };

    const handleDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggingId(id);
        setDragOverId(id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>, id: string) => {
        event.preventDefault();
        if (!draggingId) {
            const source = event.dataTransfer.getData('text/plain');
            if (source) setDraggingId(source);
        }
        if (dragOverId !== id) setDragOverId(id);
        event.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>, id: string) => {
        event.preventDefault();
        const sourceId = draggingId || event.dataTransfer.getData('text/plain');
        if (sourceId) applyReorder(sourceId, id);
        setDraggingId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverId(null);
    };

    const handleTouchStart = (id: string) => {
        setIsTouchDragging(true);
        setDraggingId(id);
        setDragOverId(id);
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (!isTouchDragging) return;
        const touch = event.touches[0];
        if (!touch) return;
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const droppable = element?.closest('[data-bookmark-id]') as HTMLElement | null;
        const targetId = droppable?.dataset.bookmarkId;
        if (targetId && targetId !== dragOverId) {
            event.preventDefault();
            setDragOverId(targetId);
        }
    };

    const handleTouchEnd = () => {
        if (draggingId && dragOverId) {
            applyReorder(draggingId, dragOverId);
        }
        setIsTouchDragging(false);
        setDraggingId(null);
        setDragOverId(null);
    };

    return {
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
    };
};

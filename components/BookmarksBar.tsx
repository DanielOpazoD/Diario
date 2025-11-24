import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Bookmark as BookmarkIcon, ExternalLink, Plus } from 'lucide-react';
import useAppStore from '../stores/useAppStore';

interface BookmarksBarProps {
  onOpenManager: () => void;
  onHeightChange?: (height: number) => void;
}

const BookmarksBar: React.FC<BookmarksBarProps> = ({ onOpenManager, onHeightChange }) => {
  const bookmarks = useAppStore((state) => state.bookmarks);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = barRef.current;
    if (!element) return;

    const notify = () => onHeightChange?.(element.getBoundingClientRect().height);
    notify();

    const resizeObserver = new ResizeObserver(notify);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [onHeightChange]);

  const favoriteBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => bookmark.isFavorite)
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  return (
    <div
      ref={barRef}
      className="fixed top-0 z-40 flex items-center gap-3 px-4 md:px-6 py-2 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm w-full md:w-[calc(100vw-18rem)] md:left-72 md:right-auto"
      role="banner"
    >
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <BookmarkIcon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Marcadores</span>
      </div>

      <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {favoriteBookmarks.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">Añade tus accesos rápidos clínicos</p>
        )}
        {favoriteBookmarks.map((bookmark) => (
          <a
            key={bookmark.id}
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            title={bookmark.note || bookmark.url}
            className="group flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            {bookmark.icon && bookmark.icon.startsWith('http') ? (
              <img src={bookmark.icon} className="w-4 h-4 rounded" alt="" loading="lazy" />
            ) : bookmark.icon ? (
              <span className="text-base" aria-hidden>
                {bookmark.icon}
              </span>
            ) : (
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`}
                className="w-4 h-4"
                alt=""
                loading="lazy"
              />
            )}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
              {bookmark.title}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      <button
        onClick={onOpenManager}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0"
        title="Gestionar marcadores"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default BookmarksBar;

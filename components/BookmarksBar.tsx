import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppWindow, Bookmark as BookmarkIcon, Plus } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import BookmarkIconGraphic from './BookmarkIcon';

interface BookmarksBarProps {
  onOpenManager: () => void;
}

const BookmarksBar: React.FC<BookmarksBarProps> = ({ onOpenManager }) => {
  const bookmarks = useAppStore((state) => state.bookmarks);

  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const appsMenuRef = useRef<HTMLDivElement>(null);

  const favoriteBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => bookmark.isFavorite)
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  const otherBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => !bookmark.isFavorite)
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appsMenuRef.current && !appsMenuRef.current.contains(event.target as Node)) {
        setIsAppsMenuOpen(false);
      }
    };

    if (isAppsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAppsMenuOpen]);

  return (
    <div
      className="fixed top-0 right-0 left-0 z-40 flex items-center gap-2.5 px-4 md:px-6 py-1.5 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm md:left-72 md:right-0"
      role="banner"
    >
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <div className="relative">
          <button
            onClick={() => setIsAppsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            title="Otras aplicaciones"
            aria-label="Otras aplicaciones"
          >
            <AppWindow className="w-4 h-4" />
          </button>

          {isAppsMenuOpen && (
            <div
              ref={appsMenuRef}
              className="absolute left-0 mt-2 w-56 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-sm py-2"
            >
              {otherBookmarks.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">Agrega marcadores para verlos aquí</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                  {otherBookmarks.map((bookmark) => (
                    <a
                      key={bookmark.id}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      title={bookmark.note || bookmark.url}
                    >
                      <BookmarkIconGraphic bookmark={bookmark} sizeClass="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-1">
                          {bookmark.title}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{bookmark.url}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <BookmarkIcon className="w-4 h-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">Marcadores</span>
      </div>

      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
            className="group flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <BookmarkIconGraphic bookmark={bookmark} sizeClass="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
              {bookmark.title}
            </span>
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

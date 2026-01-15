import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark as BookmarkIcon, LayoutGrid, Plus } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import BookmarkIconGraphic from './BookmarkIcon';

interface BookmarksBarProps {
  onOpenManager: () => void;
}

const BookmarksBar: React.FC<BookmarksBarProps> = ({ onOpenManager }) => {
  const bookmarks = useAppStore((state) => state.bookmarks);

  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const appsDropdownRef = useRef<HTMLDivElement | null>(null);

  const favoriteBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => bookmark.isFavorite)
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  const applicationBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => (bookmark.categoryId || 'default') === 'apps')
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (appsDropdownRef.current && !appsDropdownRef.current.contains(event.target as Node)) {
        setIsAppsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="fixed top-0 right-0 left-0 z-40 flex items-center gap-2.5 px-4 md:px-6 py-1.5 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md shadow-sm md:left-72 md:right-0"
      role="banner"
    >
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
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

      <div className="flex items-center gap-1.5">
        <div className="relative" ref={appsDropdownRef}>
          <button
            onClick={() => setIsAppsOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0"
            title="Aplicaciones"
            aria-expanded={isAppsOpen}
            aria-haspopup="menu"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {isAppsOpen && (
            <div
              className="absolute right-0 mt-2 w-64 max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-2 z-50"
              role="menu"
            >
              {applicationBookmarks.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No hay aplicaciones guardadas.</p>
              )}
              {applicationBookmarks.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  role="menuitem"
                  onClick={() => setIsAppsOpen(false)}
                >
                  <BookmarkIconGraphic bookmark={bookmark} sizeClass="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{bookmark.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{bookmark.url}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onOpenManager}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 shrink-0"
          title="Gestionar marcadores"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BookmarksBar;

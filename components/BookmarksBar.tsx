import React, { useMemo } from 'react';
import { Bookmark as BookmarkIcon, Plus } from 'lucide-react';
import useAppStore from '../stores/useAppStore';

interface BookmarksBarProps {
  onOpenManager: () => void;
}

const getHostname = (url: string) => {
  try {
    const normalizedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    return new URL(normalizedUrl).hostname;
  } catch (error) {
    console.warn('No se pudo obtener el dominio del marcador', { url, error });
    return '';
  }
};

const getFaviconUrl = (url: string) => {
  const hostname = getHostname(url);
  return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : '';
};

const BookmarksBar: React.FC<BookmarksBarProps> = ({ onOpenManager }) => {
  const bookmarks = useAppStore((state) => state.bookmarks);

  const favoriteBookmarks = useMemo(
    () =>
      [...bookmarks]
        .filter((bookmark) => bookmark.isFavorite)
        .sort((a, b) => a.order - b.order),
    [bookmarks]
  );

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
            {bookmark.icon && bookmark.icon.startsWith('http') ? (
              <img
                src={bookmark.icon}
                className="w-3.5 h-3.5 rounded"
                alt=""
                loading="lazy"
                onError={(event) => {
                  const fallbackUrl = getFaviconUrl(bookmark.url);
                  if (fallbackUrl && event.currentTarget.src !== fallbackUrl) {
                    event.currentTarget.src = fallbackUrl;
                  }
                }}
              />
            ) : bookmark.icon ? (
              <span className="text-sm" aria-hidden>
                {bookmark.icon}
              </span>
            ) : (
              <img src={getFaviconUrl(bookmark.url)} className="w-3.5 h-3.5" alt="" loading="lazy" />
            )}
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

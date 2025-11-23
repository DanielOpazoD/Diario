import React, { useMemo, useState } from 'react';
import { Bookmark as BookmarkIcon, ExternalLink, Plus, Star } from 'lucide-react';
import useAppStore from '../stores/useAppStore';
import BookmarksModal from './BookmarksModal';
import { Bookmark } from '../types';

const getFavicon = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch (e) {
    return '';
  }
};

const BookmarksBar: React.FC = () => {
  const { bookmarks, categories, addBookmark, updateBookmark } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favoriteBookmarks = useMemo(
    () => bookmarks.filter((b) => b.isFavorite).sort((a, b) => a.order - b.order),
    [bookmarks]
  );

  const handleSave = (data: Omit<Bookmark, 'id' | 'createdAt' | 'order'>, id?: string) => {
    if (id) {
      updateBookmark(id, data);
    } else {
      addBookmark(data);
    }
  };

  if (!favoriteBookmarks.length && !bookmarks.length) {
    return null;
  }

  return (
    <div className="sticky top-14 md:top-16 z-30 bg-white/90 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800/70">
      <div className="flex items-center gap-3 px-3 md:px-6 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300 shrink-0">
          <BookmarkIcon className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">Favoritos</span>
        </div>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
          {favoriteBookmarks.map((bm) => (
            <a
              key={bm.id}
              href={bm.url}
              target="_blank"
              rel="noopener noreferrer"
              title={bm.note || bm.url}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800/70 shadow-sm hover:shadow-md transition-all shrink-0"
            >
              {bm.icon ? (
                <span className="text-lg">{bm.icon}</span>
              ) : (
                <img src={getFavicon(bm.url)} alt="" className="w-5 h-5 rounded-sm" loading="lazy" />
              )}

              {bm.title ? (
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 max-w-[140px] truncate">{bm.title}</span>
              ) : null}

              <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>

          {bookmarks.length > 0 && favoriteBookmarks.length === 0 ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">Marca como favorito para mostrar aquí</div>
          ) : null}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Star className="w-3.5 h-3.5" />
          <span>Organiza accesos rápidos clínicos</span>
        </div>
      </div>

      <BookmarksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
      />
    </div>
  );
};

export default BookmarksBar;

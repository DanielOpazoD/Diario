import React, { useMemo, useState } from 'react';
import { Bookmark } from '../shared/types/index.ts';

interface BookmarkIconProps {
  bookmark: Pick<Bookmark, 'url' | 'icon'>;
  sizeClass?: string;
  className?: string;
}

const normalizeUrl = (url: string) => {
  if (!url) return '';
  try {
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
  } catch (error) {
    console.warn('No se pudo normalizar la URL del ícono', { url, error });
    return '';
  }
};

const getFaviconUrl = (url: string) => {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return '';

  try {
    const hostname = new URL(normalizedUrl).hostname;
    return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` : '';
  } catch (error) {
    console.warn('No se pudo obtener el favicon del marcador', { url, error });
    return '';
  }
};

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ bookmark, sizeClass = 'w-6 h-6', className }) => {
  const [customIconFailed, setCustomIconFailed] = useState(false);

  const faviconUrl = useMemo(() => getFaviconUrl(bookmark.url), [bookmark.url]);
  const customIcon = bookmark.icon?.trim();

  if (customIcon && !customIconFailed) {
    if (customIcon.startsWith('http')) {
      return (
        <img
          src={customIcon}
          alt=""
          className={`${sizeClass} rounded ${className || ''}`.trim()}
          loading="lazy"
          onError={() => setCustomIconFailed(true)}
        />
      );
    }

    return (
      <span className={`flex items-center justify-center ${sizeClass} ${className || ''}`.trim()} aria-hidden>
        <span className="text-base leading-none">{customIcon}</span>
      </span>
    );
  }

  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt=""
        className={`${sizeClass} rounded ${className || ''}`.trim()}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${sizeClass} rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300 ${
        className || ''
      }`.trim()}
      aria-hidden
    >
      🔖
    </div>
  );
};

export default BookmarkIcon;

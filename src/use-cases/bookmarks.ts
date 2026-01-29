import { Bookmark, BookmarkCategory } from '@shared/types';
import { ensureDefaultCategories, normalizeImportedBookmark } from '@domain/bookmarks';

type ExportPayload = {
  version: number;
  exportedAt: string;
  bookmarks: Bookmark[];
  categories: BookmarkCategory[];
};

export const buildBookmarksExport = (
  bookmarks: Bookmark[],
  categories: BookmarkCategory[]
): { filename: string; payload: ExportPayload } => {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
    categories,
  };

  return {
    filename: `medidiario_marcadores_${payload.exportedAt.split('T')[0]}.json`,
    payload,
  };
};

export const parseBookmarksImport = (
  text: string,
  fallbackCategories: BookmarkCategory[]
): { bookmarks: Bookmark[]; categories: BookmarkCategory[] } => {
  const parsed = JSON.parse(text);
  const importedBookmarks = Array.isArray(parsed.bookmarks)
    ? parsed.bookmarks
    : Array.isArray(parsed)
      ? parsed
      : [];
  const importedCategories = Array.isArray(parsed.categories) ? parsed.categories : fallbackCategories;

  const categoriesWithDefault = ensureDefaultCategories(importedCategories);
  const categoryIds = new Set(categoriesWithDefault.map((category) => category.id));

  const sanitizedBookmarks = importedBookmarks.map((bookmark: Bookmark, index: number) =>
    normalizeImportedBookmark(bookmark, index, categoryIds)
  );

  return {
    bookmarks: sanitizedBookmarks,
    categories: categoriesWithDefault,
  };
};

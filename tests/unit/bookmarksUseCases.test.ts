import { describe, it, expect } from 'vitest';
import { buildBookmarksExport, parseBookmarksImport } from '@use-cases/bookmarks';
import type { Bookmark, BookmarkCategory } from '@shared/types';

describe('bookmarks use-cases', () => {
  it('builds export payload with filename', () => {
    const bookmarks: Bookmark[] = [];
    const categories: BookmarkCategory[] = [{ id: 'default', name: 'General' }];
    const result = buildBookmarksExport(bookmarks, categories);

    expect(result.payload.version).toBe(1);
    expect(result.payload.bookmarks).toEqual(bookmarks);
    expect(result.payload.categories).toEqual(categories);
    expect(result.filename).toMatch(/^medidiario_marcadores_/);
  });

  it('parses import with raw array payload', () => {
    const rawBookmarks = [
      { url: 'https://example.com', title: '', createdAt: 1, order: 0 },
    ];
    const input = JSON.stringify(rawBookmarks);
    const fallbackCategories: BookmarkCategory[] = [{ id: 'default', name: 'General' }];

    const result = parseBookmarksImport(input, fallbackCategories);

    expect(result.bookmarks.length).toBe(1);
    expect(result.categories.length).toBeGreaterThan(0);
  });
});

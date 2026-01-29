import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ensureDefaultCategories,
  normalizeImportedBookmark,
  resolveBookmarkTitle,
} from '@domain/bookmarks';
import type { Bookmark, BookmarkCategory } from '@shared/types';

describe('bookmarks domain', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolveBookmarkTitle uses hostname when title empty', () => {
    expect(resolveBookmarkTitle('', 'https://example.com/path')).toBe('example.com');
  });

  it('resolveBookmarkTitle falls back to url for invalid urls', () => {
    expect(resolveBookmarkTitle('', 'not-a-url')).toBe('not-a-url');
  });

  it('ensureDefaultCategories adds missing defaults', () => {
    const categories: BookmarkCategory[] = [{ id: 'custom', name: 'Custom' }];
    const result = ensureDefaultCategories(categories);
    const ids = result.map((c) => c.id);
    expect(ids).toContain('default');
    expect(ids).toContain('apps');
  });

  it('normalizeImportedBookmark fills missing fields', () => {
    const bookmark: Bookmark = {
      id: '',
      title: '',
      url: 'https://example.com',
      createdAt: 0,
      order: 0,
    };
    const categoryIds = new Set(['default']);

    const result = normalizeImportedBookmark(bookmark, 3, categoryIds);

    expect(result.id).toBeTruthy();
    expect(result.order).toBe(0); // preserves existing order
    expect(result.createdAt).toBe(0);
    expect(result.title).toBe('example.com');
    expect(result.categoryId).toBe('default');
  });
});

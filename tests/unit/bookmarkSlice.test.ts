import { beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { createBookmarkSlice, BookmarksSlice } from '@core/stores/slices/bookmarkSlice';
import { defaultBookmarkCategories } from '@domain/bookmarks';

describe('bookmarkSlice', () => {
  const useStore = create<BookmarksSlice>(createBookmarkSlice);

  beforeEach(() => {
    useStore.setState({ bookmarks: [], bookmarkCategories: defaultBookmarkCategories } as any);
  });

  it('adds and updates bookmarks', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-0000-0000-000000000001');
    vi.spyOn(Date, 'now').mockReturnValueOnce(123);

    useStore.getState().addBookmark({ title: 'Title', url: 'https://example.com', categoryId: 'default' });
    const added = useStore.getState().bookmarks[0];
    expect(added.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(added.createdAt).toBe(123);

    useStore.getState().updateBookmark('00000000-0000-0000-0000-000000000001', { title: 'New', url: 'https://example.com/new' });
    const updated = useStore.getState().bookmarks[0];
    expect(updated.title).toBeTruthy();
  });

  it('reorders and deletes bookmarks', () => {
    useStore.getState().setBookmarks([
      { id: '00000000-0000-0000-0000-000000000001', title: 'One', url: 'https://one', createdAt: 1 } as any,
      { id: '00000000-0000-0000-0000-000000000002', title: 'Two', url: 'https://two', createdAt: 1 } as any,
    ]);
    expect(useStore.getState().bookmarks[0].order).toBe(0);
    useStore.getState().reorderBookmarks(useStore.getState().bookmarks.reverse());
    expect(useStore.getState().bookmarks[0].order).toBe(0);

    useStore.getState().deleteBookmark('00000000-0000-0000-0000-000000000001');
    expect(useStore.getState().bookmarks.find((b) => b.id === '00000000-0000-0000-0000-000000000001')).toBeUndefined();
  });

  it('manages bookmark categories', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-0000-0000-000000000003');
    useStore.getState().addBookmarkCategory({ name: 'Extra', color: 'bg-blue' });
    const category = useStore.getState().bookmarkCategories.find((c) => c.id === '00000000-0000-0000-0000-000000000003');
    expect(category?.name).toBe('Extra');

    useStore.getState().updateBookmarkCategory('00000000-0000-0000-0000-000000000003', { name: 'Updated' });
    expect(useStore.getState().bookmarkCategories.find((c) => c.id === '00000000-0000-0000-0000-000000000003')?.name).toBe('Updated');
  });
});

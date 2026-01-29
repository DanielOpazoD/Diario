import { Bookmark, BookmarkCategory } from '@shared/types';

export const defaultBookmarkCategories: BookmarkCategory[] = [
  { id: 'default', name: 'General', icon: 'Bookmark', color: 'blue' },
  { id: 'apps', name: 'Aplicaciones', icon: 'Apps', color: 'indigo' },
];

export const resolveBookmarkTitle = (title: string | undefined, url: string): string => {
  const normalizedTitle = title?.trim();
  if (normalizedTitle) return normalizedTitle;
  try {
    return new URL(url).hostname;
  } catch (error) {
    return url;
  }
};

export const ensureDefaultCategories = (categories: BookmarkCategory[]): BookmarkCategory[] => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  defaultBookmarkCategories.forEach((defaultCategory) => {
    if (!categoryMap.has(defaultCategory.id)) {
      categoryMap.set(defaultCategory.id, defaultCategory);
    }
  });

  return Array.from(categoryMap.values());
};

export const normalizeImportedBookmark = (
  bookmark: Bookmark,
  index: number,
  categoryIds: Set<string>
): Bookmark => {
  const normalizedCategoryId = bookmark.categoryId ?? 'default';
  const url = bookmark.url || '';

  return {
    ...bookmark,
    id: bookmark.id || crypto.randomUUID(),
    order: typeof bookmark.order === 'number' ? bookmark.order : index,
    createdAt: typeof bookmark.createdAt === 'number' ? bookmark.createdAt : Date.now(),
    title: resolveBookmarkTitle(bookmark.title, url),
    categoryId: categoryIds.has(normalizedCategoryId) ? normalizedCategoryId : 'default',
  };
};

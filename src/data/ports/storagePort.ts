import type { Bookmark, BookmarkCategory, GeneralTask, PatientRecord } from '@shared/types';

export interface StoragePort {
  loadRecords: () => PatientRecord[];
  loadGeneralTasks: () => GeneralTask[];
  loadBookmarks: () => Bookmark[];
  loadBookmarkCategories: () => BookmarkCategory[];
  saveRecords: (records: PatientRecord[]) => void;
  saveGeneralTasks: (tasks: GeneralTask[]) => void;
  saveBookmarks: (bookmarks: Bookmark[]) => void;
  saveBookmarkCategories: (categories: BookmarkCategory[]) => void;
}

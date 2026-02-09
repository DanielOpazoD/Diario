import { indexedDbAdapter } from '@data/adapters/indexedDbAdapter';
import type { Bookmark, BookmarkCategory, GeneralTask, PatientRecord } from '@shared/types';

export const shadowWriteToIndexedDb = async (payload: {
  records: PatientRecord[];
  generalTasks: GeneralTask[];
  bookmarks: Bookmark[];
  bookmarkCategories: BookmarkCategory[];
}) => {
  await indexedDbAdapter.saveRecords(payload.records);
  await indexedDbAdapter.saveGeneralTasks(payload.generalTasks);
  await indexedDbAdapter.saveBookmarks(payload.bookmarks);
  await indexedDbAdapter.saveBookmarkCategories(payload.bookmarkCategories);
};

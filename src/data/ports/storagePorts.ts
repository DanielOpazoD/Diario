import type { BackupFileData, Bookmark, BookmarkCategory, GeneralTask, PatientRecord } from '@shared/types';

export interface LocalStoragePort {
  loadRecords: () => PatientRecord[];
  loadGeneralTasks: () => GeneralTask[];
  loadBookmarks: () => Bookmark[];
  loadBookmarkCategories: () => BookmarkCategory[];
  saveRecords: (records: PatientRecord[]) => void;
  saveGeneralTasks: (tasks: GeneralTask[]) => void;
  saveBookmarks: (bookmarks: Bookmark[]) => void;
  saveBookmarkCategories: (categories: BookmarkCategory[]) => void;
}

export interface AsyncStoragePort {
  loadRecords: () => Promise<PatientRecord[]>;
  loadGeneralTasks: () => Promise<GeneralTask[]>;
  loadBookmarks: () => Promise<Bookmark[]>;
  loadBookmarkCategories: () => Promise<BookmarkCategory[]>;
  saveRecords: (records: PatientRecord[]) => Promise<void>;
  saveGeneralTasks: (tasks: GeneralTask[]) => Promise<void>;
  saveBookmarks: (bookmarks: Bookmark[]) => Promise<void>;
  saveBookmarkCategories: (categories: BookmarkCategory[]) => Promise<void>;
}

export interface StorageMaintenancePort {
  clearStorage: () => void;
  downloadBackupAsJson: (backupData: BackupFileData) => void;
  parseBackupFile: (file: File) => Promise<BackupFileData>;
}

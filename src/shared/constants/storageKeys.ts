/**
 * Centralized localStorage keys for the application
 * to ensure consistency and prevent typos.
 *
 * IMPORTANT: These keys match existing production keys to maintain data persistence.
 */

export const STORAGE_KEYS = {
    // Core Business Data (matches storage.ts)
    RECORDS: 'medidiario_data_v1',
    TASKS: 'medidiario_general_tasks_v1',
    BOOKMARKS: 'medidiario_bookmarks_v1',
    BOOKMARK_CATEGORIES: 'medidiario_bookmark_categories_v1',

    // Application Settings & User (matches useAppStore.ts)
    USER: 'medidiario_user',
    THEME: 'medidiario_theme',
    PATIENT_TYPES: 'medidiario_patient_types',
    SECURITY: 'medidiario_security',
    PREFERENCES: 'medidiario_preferences',
    DATA_VERSION: 'medidiario_data_version',

    // System/Diagnostic
    DEBUG_MODE: 'medidiario_debug_enabled',
    APP_VERSION: 'medidiario_app_version',

    // Reports drafts
    REPORT_DRAFT_ID: 'medidiario_report_draft_id',
    REPORT_DRAFT: 'medidiario_report_draft',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

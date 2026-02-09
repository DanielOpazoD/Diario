import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { createPatientSlice, PatientSlice } from '@core/stores/slices/patientSlice';
import { createTaskSlice, TaskSlice } from '@core/stores/slices/taskSlice';
import { createUserSlice, UserSlice } from '@core/stores/slices/userSlice';
import { createPatientTypesSlice, PatientTypesSlice } from '@core/stores/slices/patientTypesSlice';
import { createSecuritySlice, SecuritySlice } from '@core/stores/slices/securitySlice';
import { createPreferencesSlice, PreferencesSlice } from '@core/stores/slices/preferencesSlice';
import { BookmarksSlice, createBookmarkSlice } from '@core/stores/slices/bookmarkSlice';
import { createUiSlice, UiSlice } from '@core/stores/slices/uiSlice';
import { buildInitialState } from '@core/stores/initialState';
import { applyThemeClass } from '@shared/utils/theme';

type AppStore = PatientSlice & TaskSlice & UserSlice & PatientTypesSlice & SecuritySlice & PreferencesSlice & BookmarksSlice & UiSlice;

const {
  initialRecords,
  initialTasks,
  initialBookmarks,
  initialBookmarkCategories,
  initialUser,
  initialTheme,
  initialPatientTypes,
  initialSecurity,
  initialPreferences,
} = buildInitialState();

const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    devtools(
      (set, get, api) => ({
        ...createPatientSlice(set, get, api),
        ...createTaskSlice(set, get, api),
        ...createUserSlice(set, get, api),
        ...createPatientTypesSlice(set, get, api),
        ...createSecuritySlice(set, get, api),
        ...createPreferencesSlice(set, get, api),
        ...createBookmarkSlice(set, get, api),

        ...createUiSlice(set, get, api),

        // Overwrite initial state with loaded data if available
        records: initialRecords,
        generalTasks: initialTasks,
        bookmarks: initialBookmarks,
        bookmarkCategories:
          initialBookmarkCategories,
        user: initialUser,
        theme: initialTheme,
        patientTypes: initialPatientTypes,
        securityPinHash: initialSecurity.pinHash,
        securityPinSalt: initialSecurity.pinSalt,
        autoLockMinutes: initialSecurity.autoLockMinutes,
        highlightPendingPatients: initialPreferences.highlightPendingPatients,
        compactStats: initialPreferences.compactStats,
        showBookmarkBar: initialPreferences.showBookmarkBar,
      }),
      { name: 'MediDiarioStore' }
    )
  )
);

applyThemeClass(useAppStore.getState().theme);

        // Side effects are now handled by core/app/persistence.ts

// Subscriber logic removed from here as per Phase 3 Consolidation.

export default useAppStore;

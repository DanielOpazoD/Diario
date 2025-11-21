import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createPatientSlice, PatientSlice } from './slices/patientSlice';
import { createTaskSlice, TaskSlice } from './slices/taskSlice';
import { createUserSlice, UserSlice } from './slices/userSlice';
import { createSettingsSlice, SettingsSlice, defaultPatientTypes } from './slices/settingsSlice';
import { ToastMessage } from '../types';
import { 
  loadRecordsFromLocal, 
  loadGeneralTasksFromLocal, 
  saveRecordsToLocal, 
  saveGeneralTasksToLocal 
} from '../services/storage';

// UI Slice directly here for simplicity
interface UiSlice {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

type AppStore = PatientSlice & TaskSlice & UserSlice & SettingsSlice & UiSlice;

// Helper to safely parse types and avoid "null" string issues
const getInitialPatientTypes = () => {
  try {
    const stored = localStorage.getItem('medidiario_patient_types');
    if (stored && stored !== "undefined" && stored !== "null") {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error parsing stored patient types", e);
  }
  return defaultPatientTypes;
};

// Load initial state
const initialRecords = loadRecordsFromLocal();
const initialTasks = loadGeneralTasksFromLocal();
const storedUser = localStorage.getItem('medidiario_user');
const storedTheme = localStorage.getItem('medidiario_theme') as 'light' | 'dark';

const useAppStore = create<AppStore>()(
  devtools(
    (set, get, api) => ({
      ...createPatientSlice(set, get, api),
      ...createTaskSlice(set, get, api),
      ...createUserSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      
      // UI Slice Implementation
      toasts: [],
      addToast: (type, message) => set((state) => ({
        toasts: [...state.toasts, { id: crypto.randomUUID(), type, message }]
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      })),

      // Overwrite initial state with loaded data if available
      records: initialRecords,
      generalTasks: initialTasks,
      user: storedUser ? JSON.parse(storedUser) : null,
      theme: storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      patientTypes: getInitialPatientTypes(),
    }),
    { name: 'MediDiarioStore' }
  )
);

// Initialize Theme Class on load
if (useAppStore.getState().theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// --- Auto-Save Middleware (Subscriber) ---
let saveTimeout: any;

useAppStore.subscribe((state) => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    saveRecordsToLocal(state.records);
    saveGeneralTasksToLocal(state.generalTasks);
    
    if (state.user) {
      localStorage.setItem('medidiario_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('medidiario_user');
    }
    localStorage.setItem('medidiario_theme', state.theme);
    localStorage.setItem('medidiario_patient_types', JSON.stringify(state.patientTypes));
    
    console.log(' [AutoSave] Estado sincronizado con LocalStorage');
  }, 2000);
});

export default useAppStore;
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
  saveGeneralTasksToLocal,
  CACHED_KEY_KEY,
  SECURITY_ENABLED_KEY,
  SECURITY_SALT_KEY
} from '../services/storage';
import {
  deriveKeyFromPin,
  deserializeSalt,
  exportKeyToBase64,
  importKeyFromBase64,
  serializeSalt
} from '../services/encryption';

// UI Slice directly here for simplicity
interface UiSlice {
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

interface SecuritySlice {
  securityEnabled: boolean;
  encryptionKey: CryptoKey | null;
  encryptionSalt: string | null;
  enableSecurity: (pin: string) => Promise<void>;
  setEncryptionKey: (key: CryptoKey | null, saltOverride?: string | null) => void;
}

type AppStore = PatientSlice & TaskSlice & UserSlice & SettingsSlice & UiSlice & SecuritySlice;

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
const initialTasks = loadGeneralTasksFromLocal();
const storedUser = localStorage.getItem('medidiario_user');
const storedTheme = localStorage.getItem('medidiario_theme') as 'light' | 'dark';
const initialSecurityEnabled = localStorage.getItem(SECURITY_ENABLED_KEY) === 'true';
const storedSalt = localStorage.getItem(SECURITY_SALT_KEY);

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
      records: [],
      generalTasks: initialTasks,
      user: storedUser ? JSON.parse(storedUser) : null,
      theme: storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      patientTypes: getInitialPatientTypes(),
      securityEnabled: initialSecurityEnabled,
      encryptionKey: null,
      encryptionSalt: storedSalt || null,

      enableSecurity: async (pin: string) => {
        try {
          const saltBytes = get().encryptionSalt ? deserializeSalt(get().encryptionSalt as string) : undefined;
          const { key, salt } = await deriveKeyFromPin(pin, saltBytes);
          const serializedSalt = serializeSalt(salt);
          const exportedKey = await exportKeyToBase64(key);

          sessionStorage.setItem(CACHED_KEY_KEY, exportedKey);
          await saveRecordsToLocal(get().records, {
            securityEnabled: true,
            encryptionKey: key,
            encryptionSalt: serializedSalt
          });

          set({ securityEnabled: true, encryptionKey: key, encryptionSalt: serializedSalt });
        } catch (error) {
          console.error('Error enabling security', error);
          throw error;
        }
      },
      setEncryptionKey: (key, saltOverride) => {
        const currentSalt = get().encryptionSalt;
        set({ encryptionKey: key, encryptionSalt: saltOverride ?? currentSalt });
      }
    }),
    { name: 'MediDiarioStore' }
  )
);

// Initialize Theme Class on load
if (useAppStore.getState().theme === 'dark') {
  document.documentElement.classList.add('dark');
}

const bootstrapData = async () => {
  const cachedKey = sessionStorage.getItem(CACHED_KEY_KEY);
  if (cachedKey) {
    try {
      const importedKey = await importKeyFromBase64(cachedKey);
      useAppStore.getState().setEncryptionKey(importedKey);
    } catch (error) {
      console.error('No se pudo restaurar la llave de cifrado', error);
    }
  }

  try {
    const records = await loadRecordsFromLocal(useAppStore.getState().encryptionKey);
    useAppStore.getState().setRecords(records);
  } catch (error) {
    console.error('No se pudo cargar la data local', error);
  }
};

void bootstrapData();

// --- Auto-Save Middleware (Subscriber) ---
let saveTimeout: any;

useAppStore.subscribe((state) => {
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
  void saveRecordsToLocal(state.records, {
      securityEnabled: state.securityEnabled,
      encryptionKey: state.encryptionKey,
      encryptionSalt: state.encryptionSalt
    }).catch((error) => console.error('Error al guardar datos cifrados', error));
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
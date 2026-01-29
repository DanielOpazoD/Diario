type FirebaseEnv = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

const rawEnv = import.meta.env;

const firebase: FirebaseEnv = {
  apiKey: rawEnv.VITE_FIREBASE_API_KEY ?? '',
  authDomain: rawEnv.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: rawEnv.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: rawEnv.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: rawEnv.VITE_FIREBASE_APP_ID ?? '',
  measurementId: rawEnv.VITE_FIREBASE_MEASUREMENT_ID ?? undefined,
};

const geminiApiKey = rawEnv.VITE_GEMINI_API_KEY ?? '';

const isFirebaseConfigured = Boolean(
  firebase.apiKey &&
    firebase.authDomain &&
    firebase.projectId &&
    firebase.appId
);

const isGeminiConfigured = Boolean(
  geminiApiKey && geminiApiKey !== 'your_gemini_key_here'
);

export const env = {
  firebase,
  gemini: {
    apiKey: geminiApiKey,
  },
  flags: {
    isFirebaseConfigured,
    isGeminiConfigured,
  },
};

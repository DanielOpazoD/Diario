import { env } from "@shared/config/env";

const firebaseConfig = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
};

// Validar si tenemos las credenciales mínimas
const isConfigValid = env.flags.isFirebaseConfigured;

let appPromise: Promise<any | null> | null = null;
let authPromise: Promise<any | null> | null = null;
let dbPromise: Promise<any | null> | null = null;
let storagePromise: Promise<any | null> | null = null;

const getFirebaseApp = async () => {
    if (!isConfigValid) return null;
    if (!appPromise) {
        appPromise = import("firebase/app").then(({ initializeApp }) => initializeApp(firebaseConfig));
    }
    return appPromise;
};

export const getFirebaseAuth = async () => {
    if (!authPromise) {
        authPromise = getFirebaseApp().then(async (app) => {
            if (!app) return null;
            const { getAuth } = await import("firebase/auth");
            return getAuth(app);
        });
    }
    return authPromise;
};

export const getFirestoreDb = async () => {
    if (!dbPromise) {
        dbPromise = getFirebaseApp().then(async (app) => {
            if (!app) return null;
            const { getFirestore } = await import("firebase/firestore");
            return getFirestore(app);
        });
    }
    return dbPromise;
};

export const getFirebaseStorage = async () => {
    if (!storagePromise) {
        storagePromise = getFirebaseApp().then(async (app) => {
            if (!app) return null;
            const { getStorage } = await import("firebase/storage");
            return getStorage(app);
        });
    }
    return storagePromise;
};

export const isFirebaseConfigured = isConfigValid;

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
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

// Initialize Firebase solo si hay config
const app = isConfigValid ? initializeApp(firebaseConfig) : null;

export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const auth = app ? getAuth(app) : null;

export const isFirebaseConfigured = isConfigValid;

export default app;

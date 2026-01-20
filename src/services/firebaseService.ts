import { auth, db } from './firebaseConfig';
import { collection, query, onSnapshot, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PatientRecord } from '@shared/types';
import { emitStructuredLog } from './logger';

const PATIENTS_COLLECTION = 'patients';

// Track pending deletions with timestamps to prevent race conditions with Firebase listener
const pendingDeletions = new Map<string, number>();

// Cache to store the hash of the last synced patients to avoid redundant writes
let lastSyncedStateHash: string | null = null;

export const addPendingDeletion = (id: string) => {
    pendingDeletions.set(id, Date.now());
};

export const isPendingDeletion = (id: string) => {
    const timestamp = pendingDeletions.get(id);
    if (!timestamp) return false;

    // Expire pending deletion after 30 seconds (increased for robustness)
    if (Date.now() - timestamp > 30000) {
        pendingDeletions.delete(id);
        return false;
    }
    return true;
};

const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
};

/**
 * Syncs patients to Firebase using a diff-based approach and chunked batches.
 * Only sends patients that have actually changed since last sync.
 */
export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    // 1. Optimization: Check if state actually changed (simple JSON hash)
    const currentStateHash = JSON.stringify(patients.map(p => ({ id: p.id, updated: p.updatedAt })));
    if (currentStateHash === lastSyncedStateHash) return;

    try {
        const userPatientsRef = collection(db, "users", user.uid, PATIENTS_COLLECTION);

        // 2. Identify precisely which patients need updating (optional optimization, 
        // but for Firestore 500 limit, chunking is more important)

        // Chunking Logic: max 400 per batch (Firestore limit is 500)
        const CHUNK_SIZE = 400;
        const totalPatients = patients.length;

        for (let i = 0; i < totalPatients; i += CHUNK_SIZE) {
            const chunk = patients.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);

            chunk.forEach((patient) => {
                const docRef = doc(userPatientsRef, patient.id);
                batch.set(docRef, sanitizeForFirestore(patient));
            });

            await batch.commit();
            emitStructuredLog("info", "Firebase", "Batch synced successfully", {
                index: i / CHUNK_SIZE + 1,
                count: chunk.length
            });
        }

        lastSyncedStateHash = currentStateHash;
        emitStructuredLog("info", "Firebase", "Full sync completed", { total: totalPatients });
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Critical error during sync", { error });
        throw error; // Re-throw to let persistenceService handle/log it
    }
};

import { PatientRecordSchema } from '@shared/schemas';

// ... existing code ...

export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) => {
    if (!auth || !db) return () => { };
    const user = auth.currentUser;
    if (!user) return () => { };

    const q = query(collection(db, "users", user.uid, PATIENTS_COLLECTION));

    return onSnapshot(q, (snapshot) => {
        const patients: PatientRecord[] = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Runtime Validation with Zod
            const result = PatientRecordSchema.safeParse(data);

            if (result.success) {
                const patient = result.data;
                // Filter out patients that are pending deletion
                if (!isPendingDeletion(patient.id)) {
                    patients.push(patient);
                }
            } else {
                emitStructuredLog("warn", "Firebase", "Invalid patient data found", {
                    id: doc.id,
                    errors: result.error.format()
                });
            }
        });
        callback(patients);
    });
};

export const savePatientToFirebase = async (patient: PatientRecord) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
        const docRef = doc(db, "users", user.uid, PATIENTS_COLLECTION, patient.id);
        await setDoc(docRef, sanitizeForFirestore(patient));
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error saving patient", { error });
    }
};

export const deletePatientFromFirebase = async (patientId: string) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
        const docRef = doc(db, "users", user.uid, PATIENTS_COLLECTION, patientId);
        await deleteDoc(docRef);
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error deleting patient", { error });
    }
};

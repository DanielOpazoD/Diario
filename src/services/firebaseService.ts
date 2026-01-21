import { auth, db } from './firebaseConfig';
import { collection, onSnapshot, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PatientRecord } from '@shared/types';
import { emitStructuredLog } from './logger';
import { PatientRecordSchema } from '@shared/schemas';

const PATIENTS_COLLECTION = 'data'; // Restore to original primary collection
const LEGACY_PATIENTS_COLLECTION = 'patients'; // Keep bridge to newest data

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

    // Expire pending deletion after 30 seconds
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
 * Writes to the primary 'data' collection.
 */
export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    // Optimization: Check if state actually changed
    const currentStateHash = JSON.stringify(patients.map(p => ({ id: p.id, updated: p.updatedAt })));
    if (currentStateHash === lastSyncedStateHash) return;

    try {
        const userPatientsRef = collection(db, "users", user.uid, PATIENTS_COLLECTION);

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
        throw error;
    }
};

/**
 * Subscribes to patients from both primary and legacy collections.
 * Implementation uses a "Bridge" approach to merge data during reconstruction.
 */
export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) => {
    if (!auth || !db) return () => { };
    const user = auth.currentUser;
    if (!user) return () => { };

    const primaryRef = collection(db, "users", user.uid, PATIENTS_COLLECTION);
    const legacyRef = collection(db, "users", user.uid, LEGACY_PATIENTS_COLLECTION);

    // Track latest state from both sources locally
    const sourceData = {
        primary: [] as PatientRecord[],
        legacy: [] as PatientRecord[]
    };

    const mergeAndEmit = () => {
        const mergedMap = new Map<string, PatientRecord>();

        // Process legacy first (patients created in the last few hours)
        sourceData.legacy.forEach(p => mergedMap.set(p.id, p));

        // Process primary (overwrite legacy if primary is newer or exists)
        sourceData.primary.forEach(p => {
            const existing = mergedMap.get(p.id);
            if (!existing || (p.updatedAt || 0) >= (existing.updatedAt || 0)) {
                mergedMap.set(p.id, p);
            }
        });

        callback(Array.from(mergedMap.values()));
    };

    const processSnapshot = (snapshot: any, source: 'primary' | 'legacy') => {
        const patients: PatientRecord[] = [];
        snapshot.forEach((doc: any) => {
            const data = doc.data();
            const result = PatientRecordSchema.safeParse(data);

            if (result.success) {
                const patient = result.data;
                if (!isPendingDeletion(patient.id)) {
                    patients.push(patient);
                }
            } else {
                console.warn(`[Firebase][${source}] Validation failed for patient ${doc.id}:`, {
                    errors: result.error.issues,
                    rawData: data
                });
                emitStructuredLog("warn", "Firebase", `Invalid data in ${source}`, {
                    id: doc.id,
                    errors: result.error.flatten().fieldErrors
                });
            }
        });

        sourceData[source] = patients;
        mergeAndEmit();
    };

    const unsubPrimary = onSnapshot(primaryRef, (snap) => processSnapshot(snap, 'primary'));
    const unsubLegacy = onSnapshot(legacyRef, (snap) => processSnapshot(snap, 'legacy'));

    return () => {
        unsubPrimary();
        unsubLegacy();
    };
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

        // Also try to delete from legacy if it exists (cleanup)
        const legacyRef = doc(db, "users", user.uid, LEGACY_PATIENTS_COLLECTION, patientId);
        await deleteDoc(legacyRef).catch(() => { });
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error deleting patient", { error });
    }
};

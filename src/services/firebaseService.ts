import { getFirebaseAuth, getFirestoreDb } from './firebaseConfig';
import type { PatientRecord } from '@shared/types';
import { emitStructuredLog } from './logger';

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

const loadFirestoreDeps = async () => {
    const [db, auth] = await Promise.all([getFirestoreDb(), getFirebaseAuth()]);
    if (!db || !auth) return null;
    const firestore = await import('firebase/firestore');
    return { db, auth, ...firestore };
};

const loadPatientRecordSchema = async () => {
    const { PatientRecordSchema } = await import('@shared/schemas');
    return PatientRecordSchema;
};

/**
 * Syncs patients to Firebase using a diff-based approach and chunked batches.
 * Writes to the primary 'data' collection.
 */
export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
    const deps = await loadFirestoreDeps();
    if (!deps) return;
    const user = deps.auth.currentUser;
    if (!user) return;

    // Optimization: Check if state actually changed
    const currentStateHash = JSON.stringify(patients.map(p => ({ id: p.id, updated: p.updatedAt })));
    if (currentStateHash === lastSyncedStateHash) return;

    try {
        await syncIncrementalPatientsToFirebase(patients);
        lastSyncedStateHash = currentStateHash;
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Critical error during full sync", { error });
        throw error;
    }
};

/**
 * Specifically syncs a list of patients (assumed to be dirty/changed) using batches.
 */
export const syncIncrementalPatientsToFirebase = async (patients: PatientRecord[]) => {
    const deps = await loadFirestoreDeps();
    if (!deps || patients.length === 0) return;
    const user = deps.auth.currentUser;
    if (!user) return;

    try {
        const userPatientsRef = deps.collection(deps.db, "users", user.uid, PATIENTS_COLLECTION);

        const CHUNK_SIZE = 400;
        const totalPatients = patients.length;

        for (let i = 0; i < totalPatients; i += CHUNK_SIZE) {
            const chunk = patients.slice(i, i + CHUNK_SIZE);
            const batch = deps.writeBatch(deps.db);

            chunk.forEach((patient) => {
                const docRef = deps.doc(userPatientsRef, patient.id);
                batch.set(docRef, sanitizeForFirestore(patient));
            });

            await batch.commit();
            emitStructuredLog("info", "Firebase", "Incremental batch synced successfully", {
                index: i / CHUNK_SIZE + 1,
                count: chunk.length
            });
        }
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error during incremental sync", { error });
        throw error;
    }
};

/**
 * Subscribes to patients from both primary and legacy collections.
 * Implementation uses a "Bridge" approach to merge data during reconstruction.
 */
export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) => {
    let active = true;
    let unsubPrimary = () => { };
    let unsubLegacy = () => { };

    (async () => {
        const deps = await loadFirestoreDeps();
        if (!deps || !active) return;
        const user = deps.auth.currentUser;
        if (!user) return;
        const PatientRecordSchema = await loadPatientRecordSchema();

        const primaryRef = deps.collection(deps.db, "users", user.uid, PATIENTS_COLLECTION);
        const legacyRef = deps.collection(deps.db, "users", user.uid, LEGACY_PATIENTS_COLLECTION);

        const sourceData = {
            primary: [] as PatientRecord[],
            legacy: [] as PatientRecord[]
        };

        const mergeAndEmit = () => {
            const mergedMap = new Map<string, PatientRecord>();
            sourceData.legacy.forEach(p => mergedMap.set(p.id, p));
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

        unsubPrimary = deps.onSnapshot(primaryRef, (snap) => processSnapshot(snap, 'primary'));
        unsubLegacy = deps.onSnapshot(legacyRef, (snap) => processSnapshot(snap, 'legacy'));
    })();

    return () => {
        active = false;
        unsubPrimary();
        unsubLegacy();
    };
};

export const savePatientToFirebase = async (patient: PatientRecord) => {
    const deps = await loadFirestoreDeps();
    if (!deps) return;
    const user = deps.auth.currentUser;
    if (!user) return;

    try {
        const docRef = deps.doc(deps.db, "users", user.uid, PATIENTS_COLLECTION, patient.id);
        await deps.setDoc(docRef, sanitizeForFirestore(patient));
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error saving patient", { error });
    }
};

export const deletePatientFromFirebase = async (patientId: string) => {
    const deps = await loadFirestoreDeps();
    if (!deps) return;
    const user = deps.auth.currentUser;
    if (!user) return;

    try {
        const docRef = deps.doc(deps.db, "users", user.uid, PATIENTS_COLLECTION, patientId);
        await deps.deleteDoc(docRef);

        // Also try to delete from legacy if it exists (cleanup)
        const legacyRef = deps.doc(deps.db, "users", user.uid, LEGACY_PATIENTS_COLLECTION, patientId);
        await deps.deleteDoc(legacyRef).catch(() => { });
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error deleting patient", { error });
    }
};

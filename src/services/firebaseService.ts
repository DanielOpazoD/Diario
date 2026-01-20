import { auth, db } from './firebaseConfig';
import { collection, query, onSnapshot, writeBatch, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PatientRecord } from '@shared/types';
import { emitStructuredLog } from './logger';

import { STORAGE_KEYS } from '@shared/constants/storageKeys';

const PATIENTS_COLLECTION = STORAGE_KEYS.RECORDS.split('_')[1] || 'patients';

// Track pending deletions with timestamps to prevent race conditions with Firebase listener
// We keep them for 10 seconds to ensure onSnapshot doesn't re-add a deleted record
const pendingDeletions = new Map<string, number>();

export const addPendingDeletion = (id: string) => {
    pendingDeletions.set(id, Date.now());
};

export const removePendingDeletion = (id: string) => {
    pendingDeletions.delete(id);
};

export const isPendingDeletion = (id: string) => {
    const timestamp = pendingDeletions.get(id);
    if (!timestamp) return false;

    // Expire pending deletion after 10 seconds
    if (Date.now() - timestamp > 10000) {
        pendingDeletions.delete(id);
        return false;
    }
    return true;
};

const sanitizeForFirestore = (data: any) => {
    return JSON.parse(JSON.stringify(data, (_, v) => v === undefined ? null : v));
};

export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
        const batch = writeBatch(db);
        const userPatientsRef = collection(db, "users", user.uid, PATIENTS_COLLECTION);

        patients.forEach((patient) => {
            const docRef = doc(userPatientsRef, patient.id);
            // Remove undefined values because Firestore hates them
            batch.set(docRef, sanitizeForFirestore(patient));
        });

        await batch.commit();
        emitStructuredLog("info", "Firebase", "Patients synced successfully", { count: patients.length });
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error syncing patients", { error });
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

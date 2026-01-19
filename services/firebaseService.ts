import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    writeBatch
} from 'firebase/firestore';
import { db, auth } from "./firebaseConfig";
import { PatientRecord } from '../types';
import { emitStructuredLog } from './logger';

const PATIENTS_COLLECTION = 'patients';

export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
    if (!auth || !db) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
        const batch = writeBatch(db);
        const userPatientsRef = collection(db, "users", user.uid, PATIENTS_COLLECTION);

        patients.forEach((patient) => {
            const docRef = doc(userPatientsRef, patient.id);
            batch.set(docRef, patient);
        });

        await batch.commit();
        emitStructuredLog("info", "Firebase", "Patients synced successfully", { count: patients.length });
    } catch (error) {
        emitStructuredLog("error", "Firebase", "Error syncing patients", { error });
    }
};

export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) => {
    if (!auth || !db) return () => { };
    const user = auth.currentUser;
    if (!user) return () => { };

    const q = query(collection(db, "users", user.uid, PATIENTS_COLLECTION));

    return onSnapshot(q, (snapshot) => {
        const patients: PatientRecord[] = [];
        snapshot.forEach((doc) => {
            patients.push(doc.data() as PatientRecord);
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
        await setDoc(docRef, patient);
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

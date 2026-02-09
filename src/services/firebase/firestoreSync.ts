import type { PatientRecord } from '@shared/types';
import { emitStructuredLog } from '../logger';
import { getAuthInstance } from './auth';
import { getFirestoreInstance } from './firestore';
import { PatientRecordSchema } from '@shared/schemas';

const PATIENTS_COLLECTION = 'data';
const LEGACY_PATIENTS_COLLECTION = 'patients';
const pendingDeletions = new Map<string, number>();
const CONFLICT_LOG_WINDOW_MS = 10000;
const recentConflictLogs = new Map<string, number>();
let lastSyncedStateHash: string | null = null;

const sanitizeForFirestore = (data: any) => {
  return JSON.parse(JSON.stringify(data, (_, v) => (v === undefined ? null : v)));
};

const withSyncMeta = (patient: PatientRecord, source: 'local' | 'remote') => ({
  ...patient,
  updatedAt: patient.updatedAt ?? Date.now(),
  syncMeta: {
    source,
    updatedBy: patient.syncMeta?.updatedBy || 'unknown',
    updatedAt: patient.updatedAt ?? Date.now(),
  },
});

const loadFirestoreDeps = async () => {
  const [db, auth] = await Promise.all([getFirestoreInstance(), getAuthInstance()]);
  if (!db || !auth) return null;
  const firestore = await import('firebase/firestore');
  return { db, auth, ...firestore };
};

export const addPendingDeletion = (id: string) => {
  pendingDeletions.set(id, Date.now());
};

export const isPendingDeletion = (id: string) => {
  const timestamp = pendingDeletions.get(id);
  if (!timestamp) return false;
  if (Date.now() - timestamp > 30000) {
    pendingDeletions.delete(id);
    return false;
  }
  return true;
};

export const syncPatientsToFirebase = async (patients: PatientRecord[]) => {
  const deps = await loadFirestoreDeps();
  if (!deps) return;
  const user = deps.auth.currentUser;
  if (!user) return;

  const currentStateHash = JSON.stringify(
    patients.map(p => ({
      id: p.id,
      updated: p.updatedAt || 0,
      created: p.createdAt || 0,
    }))
  );
  if (currentStateHash === lastSyncedStateHash) return;

  try {
    await syncIncrementalPatientsToFirebase(patients);
    lastSyncedStateHash = currentStateHash;
  } catch (error) {
    emitStructuredLog('error', 'Firebase', 'Critical error during full sync', { error });
    throw error;
  }
};

export const syncIncrementalPatientsToFirebase = async (patients: PatientRecord[]) => {
  const deps = await loadFirestoreDeps();
  if (!deps || patients.length === 0) return;
  const user = deps.auth.currentUser;
  if (!user) return;

  try {
    const userPatientsRef = deps.collection(deps.db, 'users', user.uid, PATIENTS_COLLECTION);
    const CHUNK_SIZE = 400;

    for (let i = 0; i < patients.length; i += CHUNK_SIZE) {
      const chunk = patients.slice(i, i + CHUNK_SIZE);
      const batch = deps.writeBatch(deps.db);

      chunk.forEach((patient) => {
        const docRef = deps.doc(userPatientsRef, patient.id);
        batch.set(docRef, sanitizeForFirestore(withSyncMeta(patient, 'local')));
      });

      await batch.commit();
      emitStructuredLog('info', 'Firebase', 'Incremental batch synced successfully', {
        index: i / CHUNK_SIZE + 1,
        count: chunk.length,
      });
    }
  } catch (error) {
    emitStructuredLog('error', 'Firebase', 'Error during incremental sync', { error });
    throw error;
  }
};

const shouldLogConflict = (id: string) => {
  const now = Date.now();
  const last = recentConflictLogs.get(id) || 0;
  if (now - last < CONFLICT_LOG_WINDOW_MS) return false;
  recentConflictLogs.set(id, now);
  return true;
};

export const subscribeToPatients = (callback: (patients: PatientRecord[]) => void) => {
  let active = true;
  let unsubPrimary = () => {};
  let unsubLegacy = () => {};

  (async () => {
    const deps = await loadFirestoreDeps();
    if (!deps || !active) return;
    const user = deps.auth.currentUser;
    if (!user) return;
    const primaryRef = deps.collection(deps.db, 'users', user.uid, PATIENTS_COLLECTION);
    const legacyRef = deps.collection(deps.db, 'users', user.uid, LEGACY_PATIENTS_COLLECTION);

    const sourceData = {
      primary: [] as PatientRecord[],
      legacy: [] as PatientRecord[],
    };

    const mergeAndEmit = () => {
      const mergedMap = new Map<string, PatientRecord>();
      sourceData.legacy.forEach(p => mergedMap.set(p.id, p));
      sourceData.primary.forEach(p => {
        const existing = mergedMap.get(p.id);
        if (!existing || (p.updatedAt || 0) >= (existing.updatedAt || 0)) {
          mergedMap.set(p.id, withSyncMeta(p, 'remote'));
        } else if (shouldLogConflict(p.id)) {
          emitStructuredLog('warn', 'Firebase', 'Conflict resolved using newer local record', {
            id: p.id,
            localUpdatedAt: existing.updatedAt,
            remoteUpdatedAt: p.updatedAt,
          });
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
          emitStructuredLog('warn', 'Firebase', `Validation failed for patient in ${source}`, {
            id: doc.id,
            errors: result.error.flatten().fieldErrors,
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
    const docRef = deps.doc(deps.db, 'users', user.uid, PATIENTS_COLLECTION, patient.id);
    await deps.setDoc(docRef, sanitizeForFirestore(patient));
  } catch (error) {
    emitStructuredLog('error', 'Firebase', 'Error saving patient', { error });
  }
};

export const deletePatientFromFirebase = async (patientId: string) => {
  const deps = await loadFirestoreDeps();
  if (!deps) return;
  const user = deps.auth.currentUser;
  if (!user) return;

  try {
    const docRef = deps.doc(deps.db, 'users', user.uid, PATIENTS_COLLECTION, patientId);
    await deps.deleteDoc(docRef);

    const legacyRef = deps.doc(deps.db, 'users', user.uid, LEGACY_PATIENTS_COLLECTION, patientId);
    await deps.deleteDoc(legacyRef).catch(() => {});
  } catch (error) {
    emitStructuredLog('error', 'Firebase', 'Error deleting patient', { error });
  }
};

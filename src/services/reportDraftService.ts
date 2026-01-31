import { getAuthInstance } from './firebase/auth';
import { getFirestoreInstance } from './firebase/firestore';
import { emitStructuredLog } from './logger';
import type { ReportRecord } from '@domain/report/entities';

const REPORTS_COLLECTION = 'reportDrafts';

const sanitizeForFirestore = (data: any) => {
  return JSON.parse(JSON.stringify(data, (_, v) => (v === undefined ? null : v)));
};

const loadFirestoreDeps = async () => {
  const [db, auth] = await Promise.all([getFirestoreInstance(), getAuthInstance()]);
  if (!db || !auth) return null;
  const firestore = await import('firebase/firestore');
  return { db, auth, ...firestore };
};

export const saveReportDraft = async (draftId: string, record: ReportRecord) => {
  const deps = await loadFirestoreDeps();
  if (!deps) return;
  const user = deps.auth.currentUser;
  if (!user) return;

  try {
    const docRef = deps.doc(deps.db, 'users', user.uid, REPORTS_COLLECTION, draftId);
    await deps.setDoc(docRef, sanitizeForFirestore({ record, updatedAt: Date.now() }));
  } catch (error) {
    emitStructuredLog('error', 'ReportDraft', 'Error saving report draft', { error });
  }
};

export const loadReportDraft = async (draftId: string): Promise<{ record: ReportRecord; updatedAt: number } | null> => {
  const deps = await loadFirestoreDeps();
  if (!deps) return null;
  const user = deps.auth.currentUser;
  if (!user) return null;

  try {
    const docRef = deps.doc(deps.db, 'users', user.uid, REPORTS_COLLECTION, draftId);
    const snap = await deps.getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data?.record) return null;
    return { record: data.record as ReportRecord, updatedAt: data.updatedAt || 0 };
  } catch (error) {
    emitStructuredLog('error', 'ReportDraft', 'Error loading report draft', { error });
    return null;
  }
};

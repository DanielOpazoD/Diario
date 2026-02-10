import { useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';
import { safeGetItem, safeSetItem } from '@shared/utils/safeStorage';
import { loadDraftReport, saveDraftReport } from '@use-cases/reports';
import { loadJson, saveJson } from '@shared/utils/storageJson';
import { useDebouncedCallback } from '@shared/hooks/useDebouncedCallback';
import { sanitizeReportRecord } from '@domain/report/sanitizeRecord';
import type { ReportRecord } from '@domain/report/entities';

type UserLike = {
  uid?: string;
  email?: string;
  name?: string;
  avatar?: string;
} | null;

const readLocal = (key: string) => safeGetItem(key);

const writeLocal = (key: string, value: string) => safeSetItem(key, value);

type UseReportDraftOptions = {
  skipRemoteLoad?: boolean;
};

const createDraftId = () => (
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
);

export const useReportDraft = (
  user: UserLike,
  initialRecord: ReportRecord,
  options?: UseReportDraftOptions
) => {
  const [record, setRecord] = useState<ReportRecord>(initialRecord);
  const draftIdRef = useRef<string>('');
  const { debounced: scheduleSave, cancel: cancelSave } = useDebouncedCallback(
    (nextRecord: ReportRecord, nextUser: UserLike) => {
      if (!draftIdRef.current) return;
      const sanitizedRecord = sanitizeReportRecord(nextRecord);
      const payload = { record: sanitizedRecord, updatedAt: Date.now() };
      saveJson(STORAGE_KEYS.REPORT_DRAFT, payload);
      if (nextUser) {
        saveDraftReport(draftIdRef.current, sanitizedRecord);
      }
    },
    800
  );

  useEffect(() => {
    const existingId = readLocal(STORAGE_KEYS.REPORT_DRAFT_ID);
    const draftId = existingId || createDraftId();
    draftIdRef.current = draftId;
    if (!existingId) {
      writeLocal(STORAGE_KEYS.REPORT_DRAFT_ID, draftId);
    }
  }, []);

  useEffect(() => {
    const parsed = loadJson<{ record: ReportRecord; updatedAt?: number } | null>(
      STORAGE_KEYS.REPORT_DRAFT,
      null
    );
    if (parsed?.record) {
      setRecord(sanitizeReportRecord(parsed.record));
    }
  }, []);

  useEffect(() => {
    if (options?.skipRemoteLoad) return;
    const draftId = draftIdRef.current;
    if (!draftId || !user) return;
    let cancelled = false;

    (async () => {
      const remote = await loadDraftReport(draftId);
      if (!remote || cancelled) return;
      const parsed = loadJson<{ updatedAt?: number } | null>(STORAGE_KEYS.REPORT_DRAFT, null);
      const localUpdatedAt = parsed?.updatedAt || 0;
      if (remote.updatedAt > localUpdatedAt) {
        const sanitizedRemote = sanitizeReportRecord(remote.record);
        setRecord(sanitizedRemote);
        saveJson(STORAGE_KEYS.REPORT_DRAFT, { record: sanitizedRemote, updatedAt: remote.updatedAt });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [options?.skipRemoteLoad, user]);

  useEffect(() => {
    scheduleSave(record, user);
    return () => cancelSave();
  }, [record, user, scheduleSave, cancelSave]);

  return { record, setRecord };
};

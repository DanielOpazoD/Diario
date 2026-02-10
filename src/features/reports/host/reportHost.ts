import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppActions } from '@core/app/state/useAppActions';
import { useAppState } from '@core/app/state/useAppState';
import { safeSessionGetItem, safeSessionRemoveItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import type {
  AttachedFile,
  PatientCreateInput,
  PatientRecord,
  PatientTypeConfig,
  User,
} from '@shared/types';
import { savePatientRecord } from '@use-cases/patient/save';
import {
  downloadPatientFileBlob,
  downloadPatientFileBlobById,
  updatePatientFileById,
  uploadPatientFile,
} from '@use-cases/attachments';

export type ReportToastType = 'success' | 'error' | 'info';

export type ReportHostState = {
  user: User | null;
  records: PatientRecord[];
  patientTypes: PatientTypeConfig[];
};

export type ReportHostActions = {
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (patient: PatientRecord) => void;
  addToast: (type: ReportToastType, message: string) => void;
};

export type ReportDataPort = {
  savePatientRecord: (patientData: PatientCreateInput, existing: PatientRecord | null) => {
    patient: PatientRecord;
    isUpdate: boolean;
    message: string;
  };
  downloadPatientFileBlob: (url: string) => Promise<Blob>;
  downloadPatientFileBlobById: (patientId: string, fileId: string, existingFileName?: string) => Promise<Blob>;
  updatePatientFileById: (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName?: string
  ) => Promise<AttachedFile>;
  uploadPatientFile: (file: File, patientId: string) => Promise<AttachedFile>;
};

export type ReportSessionPort = {
  getLinkedJsonRaw: () => string | null;
  setLinkedJsonRaw: (value: string) => void;
  getTopbarContextRaw: () => string | null;
  setTopbarContextRaw: (value: string) => void;
  clearTopbarContext: () => void;
};

export type ReportHostContext = {
  state: ReportHostState;
  actions: ReportHostActions;
  data: ReportDataPort;
  session: ReportSessionPort;
  locationSearch: string;
  openExternal: (url: string) => void;
  emitReportContextChanged: () => void;
};

const noop = () => undefined;
const missingHostError = (method: string): Error => (
  new Error(`[reports-host] Missing host adapter: ${method}`)
);
const missingHostAction = (method: string) => {
  throw missingHostError(method);
};

export const createFallbackReportHost = (): ReportHostContext => ({
  state: {
    user: null,
    records: [],
    patientTypes: [],
  },
  actions: {
    addPatient: noop,
    updatePatient: noop,
    addToast: noop,
  },
  data: {
    savePatientRecord: () => missingHostAction('data.savePatientRecord'),
    downloadPatientFileBlob: async () => missingHostAction('data.downloadPatientFileBlob'),
    downloadPatientFileBlobById: async () => missingHostAction('data.downloadPatientFileBlobById'),
    updatePatientFileById: async () => missingHostAction('data.updatePatientFileById'),
    uploadPatientFile: async () => missingHostAction('data.uploadPatientFile'),
  },
  session: {
    getLinkedJsonRaw: () => null,
    setLinkedJsonRaw: noop,
    getTopbarContextRaw: () => null,
    setTopbarContextRaw: noop,
    clearTopbarContext: noop,
  },
  locationSearch: '',
  openExternal: noop,
  emitReportContextChanged: noop,
});

export const useDefaultReportHostContext = (): ReportHostContext => {
  const location = useLocation();
  const appState = useAppState();
  const appActions = useAppActions();

  const openExternal = useCallback((url: string) => {
    if (typeof window === 'undefined') return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const emitReportContextChanged = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('medidiario:report-context'));
  }, []);

  return useMemo(() => ({
    state: {
      user: appState.user,
      records: appState.records,
      patientTypes: appState.patientTypes,
    },
    actions: {
      addPatient: appActions.addPatient,
      updatePatient: appActions.updatePatient,
      addToast: appActions.addToast,
    },
    data: {
      savePatientRecord,
      downloadPatientFileBlob,
      downloadPatientFileBlobById,
      updatePatientFileById,
      uploadPatientFile,
    },
    session: {
      getLinkedJsonRaw: () => safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
      setLinkedJsonRaw: (value: string) => safeSessionSetItem(SESSION_KEYS.REPORT_LINKED_JSON, value),
      getTopbarContextRaw: () => safeSessionGetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT),
      setTopbarContextRaw: (value: string) => safeSessionSetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT, value),
      clearTopbarContext: () => safeSessionRemoveItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT),
    },
    locationSearch: location.search,
    openExternal,
    emitReportContextChanged,
  }), [
    appActions.addPatient,
    appActions.updatePatient,
    appActions.addToast,
    appState.user,
    appState.records,
    appState.patientTypes,
    location.search,
    openExternal,
    emitReportContextChanged,
  ]);
};

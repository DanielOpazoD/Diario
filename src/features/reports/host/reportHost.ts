
import type {
  ReportAttachedFile,
  ReportPatientCreateInput,
  ReportPatientRecord,
  ReportPatientTypeConfig,
  ReportUser,
} from '../types';
import type { ReportRecord } from '../domain/entities';

export type ReportToastType = 'success' | 'error' | 'info';

export type ReportHostState = {
  user: ReportUser | null;
  records: ReportPatientRecord[];
  patientTypes: ReportPatientTypeConfig[];
};

export type ReportHostActions = {
  addPatient: (patient: ReportPatientRecord) => void;
  updatePatient: (patient: ReportPatientRecord) => void;
  addToast: (type: ReportToastType, message: string) => void;
};

export type ReportDataPort = {
  savePatientRecord: (patientData: ReportPatientCreateInput, existing: ReportPatientRecord | null) => {
    patient: ReportPatientRecord;
    isUpdate: boolean;
    message: string;
  };
  saveDraftReport: (draftId: string, record: ReportRecord) => Promise<void>;
  loadDraftReport: (draftId: string) => Promise<{ record: ReportRecord; updatedAt: number } | null>;
  extractLabText: (file: File) => Promise<string>;
  downloadPatientFileBlob: (url: string) => Promise<Blob>;
  downloadPatientFileBlobById: (patientId: string, fileId: string, existingFileName?: string) => Promise<Blob>;
  updatePatientFileById: (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName?: string
  ) => Promise<ReportAttachedFile>;
  uploadPatientFile: (file: File, patientId: string) => Promise<ReportAttachedFile>;
};

export type ReportUtilsPort = {
  calculateAge: (birthDate: string | undefined, refDate?: Date) => string;
  normalizeBirthDateInput: (value: string) => string;
  sanitizeRichText: (html: string) => string;
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
  utils: ReportUtilsPort;
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
    saveDraftReport: async () => missingHostAction('data.saveDraftReport'),
    loadDraftReport: async () => null,
    extractLabText: async () => '',
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
  utils: {
    calculateAge: () => 'N/A',
    normalizeBirthDateInput: (v) => v,
    sanitizeRichText: (v) => v,
  },
  locationSearch: '',
  openExternal: noop,
  emitReportContextChanged: noop,
});

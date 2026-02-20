export type LinkedJsonSource = {
  patientId: string;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  driveUrl?: string;
};

export type ReportErrorPayload = { reportId?: string };

export type {
  AttachedFile as ReportAttachedFile,
  PendingTask as ReportPendingTask,
  PatientRecord as ReportPatientRecord,
  PatientCreateInput as ReportPatientCreateInput,
  PatientTypeConfig as ReportPatientTypeConfig,
  User as ReportUser,
} from '@shared/types';

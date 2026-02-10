export type LinkedJsonSource = {
  patientId: string;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  driveUrl?: string;
};

export type ReportErrorPayload = { reportId?: string };

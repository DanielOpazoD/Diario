export type LinkedJsonSource = {
  patientId: string;
  fileId: string;
  fileName?: string;
  mimeType?: string;
  driveUrl?: string;
};

export type ReportErrorPayload = { reportId?: string };

// --- Cloned Types for Portability ---

export interface ReportPendingTask {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt?: number;
  completedAt?: number;
  completionNote?: string;
}

export interface ReportAttachedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  driveUrl: string;
  thumbnailLink?: string;
  tags?: string[];
  description?: string;
  customTitle?: string;
  customTypeLabel?: string;
  noteDate?: string;
  category?: 'lab' | 'imaging' | 'report' | 'prescription' | 'other';
  isStarred?: boolean;
}

export interface ReportPatientRecord {
  id: string;
  name: string;
  rut: string;
  driveFolderId?: string | null;
  birthDate?: string;
  gender?: string;
  date: string;
  type: string;
  typeId?: string;
  entryTime?: string;
  exitTime?: string;
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: ReportPendingTask[];
  attachedFiles: ReportAttachedFile[];
  updatedAt?: number;
  createdAt?: number;
  syncMeta?: {
    source?: 'local' | 'remote';
    updatedBy?: string;
    updatedAt?: number;
  };
}

export type ReportPatientCreateInput = Omit<ReportPatientRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface ReportUser {
  name: string;
  email: string;
  avatar: string;
}

export interface ReportPatientTypeConfig {
  id: string;
  label: string;
  colorClass: string;
  isDefault?: boolean;
}

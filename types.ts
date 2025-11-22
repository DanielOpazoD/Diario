
export enum PatientType {
  HOSPITALIZADO = 'Hospitalizado',
  POLICLINICO = 'Policlínico',
  EXTRA = 'Extra',
  TURNO = 'Turno',
}

export interface PatientTypeConfig {
  id: string;
  label: string; // The text stored in the record (e.g. "Hospitalizado")
  colorClass: string; // Tailwind classes for styling
  isDefault?: boolean;
}

export interface PendingTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface GeneralTask {
  id: string;
  text: string;
  isCompleted: boolean;
  createdAt: number;
  priority: 'low' | 'medium' | 'high';
}

export interface AttachedFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  driveUrl: string;
  thumbnailLink?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  rut: string;
  birthDate?: string; // YYYY-MM-DD
  gender?: string;
  date: string; // ISO String YYYY-MM-DD
  type: string; // Dynamic string type
  entryTime?: string; // HH:mm
  exitTime?: string; // HH:mm
  diagnosis: string;
  clinicalNote: string;
  pendingTasks: PendingTask[];
  attachedFiles: AttachedFile[];
  createdAt: number;
}

export interface EncryptedPatientRecord {
  id: string;
  iv: string;
  data: string;
}

export interface AIAnalysisResult {
  structuredDiagnosis: string;
  extractedTasks: string[];
}

export interface ExtractedPatientData {
  name: string;
  rut: string;
  birthDate: string;
  gender: string;
}

export interface User {
  name: string;
  email: string;
  avatar: string;
}

export type ViewMode = 'daily' | 'search' | 'stats' | 'settings' | 'tasks';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details?: any;
}

export interface DriveFolderPreference {
  id: string | null;
  name: string;
  driveId?: string | null;
}

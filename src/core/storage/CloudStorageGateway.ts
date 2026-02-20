import { AttachedFile } from '@shared/types';

export interface CloudStorageGateway {
    // Attachment management (Firebase)
    uploadFile(file: File, patientId: string): Promise<AttachedFile>;
    updateFile(file: File, patientId: string, fileId: string, existingFileName?: string): Promise<AttachedFile>;
    deleteFile(patientId: string, fileId: string, fileName?: string): Promise<void>;
    listPatientFiles(patientId: string): Promise<AttachedFile[]>;
    listAllPatientFiles(): Promise<Record<string, AttachedFile[]>>;
    downloadFileAsBlob(url: string): Promise<Blob>;
    downloadFileById(patientId: string, fileId: string, existingFileName?: string): Promise<Blob>;

    // Backup management (Google Drive)
    uploadBackup(fileContent: string, fileName: string, accessToken: string, appName: string, folderId?: string): Promise<any>;
    listFolderEntries(accessToken: string, folderId?: string): Promise<{ files: any[] }>;
}

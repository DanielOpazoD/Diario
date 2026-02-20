import { CloudStorageGateway } from '@core/storage/CloudStorageGateway';
import { AttachedFile } from '@shared/types';
import * as firebaseStorage from '@services/firebaseStorageService';
import * as googleDrive from '@services/googleService';

export class UnifiedCloudStorageGateway implements CloudStorageGateway {
    // Firebase Implementation
    async uploadFile(file: File, patientId: string): Promise<AttachedFile> {
        return firebaseStorage.uploadFileToFirebase(file, patientId);
    }

    async updateFile(file: File, patientId: string, fileId: string, existingFileName?: string): Promise<AttachedFile> {
        return firebaseStorage.updateFileInFirebaseById(file, patientId, fileId, existingFileName);
    }

    async deleteFile(patientId: string, fileId: string, fileName?: string): Promise<void> {
        return firebaseStorage.deleteFileFromFirebase(patientId, fileName || '', fileId);
    }

    async listPatientFiles(patientId: string): Promise<AttachedFile[]> {
        return firebaseStorage.listPatientFilesFromFirebase(patientId);
    }

    async listAllPatientFiles(): Promise<Record<string, AttachedFile[]>> {
        return firebaseStorage.listAllPatientFilesFromFirebase();
    }

    async downloadFileAsBlob(url: string): Promise<Blob> {
        return firebaseStorage.downloadFileBlobFromFirebaseUrl(url);
    }

    async downloadFileById(patientId: string, fileId: string, existingFileName?: string): Promise<Blob> {
        return firebaseStorage.downloadFileBlobFromFirebaseById(patientId, fileId, existingFileName);
    }

    // Google Drive Implementation
    async uploadBackup(fileContent: string, fileName: string, accessToken: string, appName: string, folderId?: string): Promise<any> {
        return googleDrive.uploadFileToDrive(fileContent, fileName, accessToken, appName, folderId);
    }

    async listFolderEntries(accessToken: string, folderId?: string): Promise<{ files: any[] }> {
        return googleDrive.listFolderEntries(accessToken, folderId);
    }
}

export const cloudStorageGateway: CloudStorageGateway = new UnifiedCloudStorageGateway();

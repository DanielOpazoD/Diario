import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnifiedCloudStorageGateway } from '../../src/services/storage/UnifiedCloudStorageGateway';
import * as firebaseStorage from '../../src/services/firebaseStorageService';
import * as googleDrive from '../../src/services/googleService';
import { AttachedFile } from '../../src/shared/types';

vi.mock('../../src/services/firebaseStorageService', () => ({
    uploadFileToFirebase: vi.fn(),
    updateFileInFirebaseById: vi.fn(),
    deleteFileFromFirebase: vi.fn(),
    listPatientFilesFromFirebase: vi.fn(),
    listAllPatientFilesFromFirebase: vi.fn(),
    downloadFileBlobFromFirebaseUrl: vi.fn(),
    downloadFileBlobFromFirebaseById: vi.fn(),
}));

vi.mock('../../src/services/googleService', () => ({
    uploadFileToDrive: vi.fn(),
    listFolderEntries: vi.fn(),
}));

describe('UnifiedCloudStorageGateway', () => {
    let gateway: UnifiedCloudStorageGateway;

    beforeEach(() => {
        vi.clearAllMocks();
        gateway = new UnifiedCloudStorageGateway();
    });

    describe('Firebase Implementation', () => {
        const mockFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
        const mockAttachedFile: AttachedFile = {
            id: 'f1',
            name: 'test.txt',
            mimeType: 'text/plain',
            size: 13,
            uploadedAt: 12345,
            driveUrl: 'http://example.com'
        };

        it('uploadFile delegates to firebaseStorage', async () => {
            vi.mocked(firebaseStorage.uploadFileToFirebase).mockResolvedValue(mockAttachedFile);
            const result = await gateway.uploadFile(mockFile, 'p1');
            expect(firebaseStorage.uploadFileToFirebase).toHaveBeenCalledWith(mockFile, 'p1');
            expect(result).toEqual(mockAttachedFile);
        });

        it('updateFile delegates to firebaseStorage', async () => {
            vi.mocked(firebaseStorage.updateFileInFirebaseById).mockResolvedValue(mockAttachedFile);
            const result = await gateway.updateFile(mockFile, 'p1', 'f1', 'old.txt');
            expect(firebaseStorage.updateFileInFirebaseById).toHaveBeenCalledWith(mockFile, 'p1', 'f1', 'old.txt');
            expect(result).toEqual(mockAttachedFile);
        });

        it('deleteFile delegates to firebaseStorage', async () => {
            vi.mocked(firebaseStorage.deleteFileFromFirebase).mockResolvedValue(undefined);
            await gateway.deleteFile('p1', 'f1', 'test.txt');
            expect(firebaseStorage.deleteFileFromFirebase).toHaveBeenCalledWith('p1', 'test.txt', 'f1');
        });

        it('deleteFile falls back to empty string for filename', async () => {
            vi.mocked(firebaseStorage.deleteFileFromFirebase).mockResolvedValue(undefined);
            await gateway.deleteFile('p1', 'f1');
            expect(firebaseStorage.deleteFileFromFirebase).toHaveBeenCalledWith('p1', '', 'f1');
        });

        it('listPatientFiles delegates to firebaseStorage', async () => {
            vi.mocked(firebaseStorage.listPatientFilesFromFirebase).mockResolvedValue([mockAttachedFile]);
            const result = await gateway.listPatientFiles('p1');
            expect(firebaseStorage.listPatientFilesFromFirebase).toHaveBeenCalledWith('p1');
            expect(result).toEqual([mockAttachedFile]);
        });

        it('listAllPatientFiles delegates to firebaseStorage', async () => {
            const mockDict = { p1: [mockAttachedFile] };
            vi.mocked(firebaseStorage.listAllPatientFilesFromFirebase).mockResolvedValue(mockDict);
            const result = await gateway.listAllPatientFiles();
            expect(firebaseStorage.listAllPatientFilesFromFirebase).toHaveBeenCalled();
            expect(result).toEqual(mockDict);
        });

        it('downloadFileAsBlob delegates to firebaseStorage', async () => {
            const mockBlob = new Blob();
            vi.mocked(firebaseStorage.downloadFileBlobFromFirebaseUrl).mockResolvedValue(mockBlob);
            const result = await gateway.downloadFileAsBlob('http://url');
            expect(firebaseStorage.downloadFileBlobFromFirebaseUrl).toHaveBeenCalledWith('http://url');
            expect(result).toBe(mockBlob);
        });

        it('downloadFileById delegates to firebaseStorage', async () => {
            const mockBlob = new Blob();
            vi.mocked(firebaseStorage.downloadFileBlobFromFirebaseById).mockResolvedValue(mockBlob);
            const result = await gateway.downloadFileById('p1', 'f1', 'name.txt');
            expect(firebaseStorage.downloadFileBlobFromFirebaseById).toHaveBeenCalledWith('p1', 'f1', 'name.txt');
            expect(result).toBe(mockBlob);
        });
    });

    describe('Google Drive Implementation', () => {
        it('uploadBackup delegates to googleDrive', async () => {
            const mockResponse = { id: 'd1' };
            vi.mocked(googleDrive.uploadFileToDrive).mockResolvedValue(mockResponse);
            const result = await gateway.uploadBackup('data', 'test.json', 'token123', 'App', 'folder1');
            expect(googleDrive.uploadFileToDrive).toHaveBeenCalledWith('data', 'test.json', 'token123', 'App', 'folder1');
            expect(result).toEqual(mockResponse);
        });

        it('listFolderEntries delegates to googleDrive', async () => {
            const mockResponse = { files: [{ id: 'f1' }] };
            vi.mocked(googleDrive.listFolderEntries).mockResolvedValue(mockResponse);
            const result = await gateway.listFolderEntries('token123', 'folder1');
            expect(googleDrive.listFolderEntries).toHaveBeenCalledWith('token123', 'folder1');
            expect(result).toEqual(mockResponse);
        });
    });
});

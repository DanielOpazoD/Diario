import { getAuthInstance } from "./firebase/auth";
import { getStorageInstance } from "./firebase/storage";
import { AttachedFile } from '@shared/types';
import { emitStructuredLog } from "./logger";
import { anonymizeIdentifier, summarizeUrlForLog } from '@shared/utils/privacy';

const getFirebaseContext = async () => {
    const storage = await getStorageInstance();
    const auth = await getAuthInstance();
    if (!auth || !storage) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return { storage, user };
};

const buildPatientStoragePath = (uid: string, patientId: string) => (
    `users/${uid}/patients/${patientId}`
);

const getFileExtension = (fileName: string) => {
    const trimmed = fileName.trim();
    const dotIndex = trimmed.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === trimmed.length - 1) return '';
    return trimmed.slice(dotIndex + 1).toLowerCase();
};

const buildStorageObjectName = (fileId: string, fileName?: string) => {
    const extension = fileName ? getFileExtension(fileName) : '';
    return extension ? `${fileId}.${extension}` : fileId;
};

const buildDisplayFileName = (storedName: string) => {
    const dotIndex = storedName.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === storedName.length - 1) return 'archivo';
    const extension = storedName.slice(dotIndex + 1).toLowerCase();
    return `archivo.${extension}`;
};

const resolveStoredFileName = (fileId: string, storageObjectName: string): string => {
    const prefix = `${fileId}_`;
    if (storageObjectName === fileId) return 'archivo';
    if (storageObjectName.startsWith(`${fileId}.`)) {
        return buildDisplayFileName(storageObjectName);
    }
    if (!storageObjectName.startsWith(prefix)) return storageObjectName;
    const resolved = storageObjectName.slice(prefix.length);
    if (resolved) return resolved;
    return storageObjectName;
};

const resolveExistingFileStorageRef = async (
    patientId: string,
    fileId: string,
    existingFileName?: string
) => {
    const { storage, user } = await getFirebaseContext();
    const { ref, listAll } = await import("firebase/storage");

    const trimmedName = existingFileName?.trim();
    const patientFolderRef = ref(storage, buildPatientStoragePath(user.uid, patientId));
    try {
        const listing = await listAll(patientFolderRef);
        const expectedLegacyName = trimmedName ? `${fileId}_${trimmedName}` : null;
        const expectedFlatName = trimmedName ? buildStorageObjectName(fileId, trimmedName) : null;
        const matchedRef = (
            (expectedLegacyName ? listing.items.find((item) => item.name === expectedLegacyName) : null)
            || (expectedFlatName ? listing.items.find((item) => item.name === expectedFlatName) : null)
            || listing.items.find((item) => item.name === fileId)
            || listing.items.find((item) => item.name.startsWith(`${fileId}_`))
            || listing.items.find((item) => item.name.startsWith(`${fileId}.`))
        );
        if (matchedRef) {
            return {
                storageRef: matchedRef,
                fileName: resolveStoredFileName(fileId, matchedRef.name),
            };
        }
    } catch (_error) {
        // If listing fails (permissions/network), fallback to deterministic path when filename exists.
    }

    if (trimmedName) {
        const normalizedObjectName = buildStorageObjectName(fileId, trimmedName);
        return {
            storageRef: ref(storage, `${buildPatientStoragePath(user.uid, patientId)}/${normalizedObjectName}`),
            fileName: trimmedName,
        };
    }

    throw new Error(`File not found for patientId=${patientId} fileId=${fileId}`);
};

export const uploadFileToFirebase = async (
    file: File,
    patientId: string
): Promise<AttachedFile> => {
    const { storage, user } = await getFirebaseContext();

    const fileId = crypto.randomUUID();
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const objectName = buildStorageObjectName(fileId, file.name);
    const storageRef = ref(storage, `users/${user.uid}/patients/${patientId}/${objectName}`);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return {
            id: fileId,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedAt: Date.now(),
            driveUrl: downloadUrl, // Reusing driveUrl field for convenience, or we could add firebaseURL
            isStarred: false
        };
    } catch (error) {
        emitStructuredLog("error", "FirebaseStorage", "Error uploading file", {
            error,
            patientId: anonymizeIdentifier(patientId, 'patient'),
            fileId: anonymizeIdentifier(fileId, 'file'),
            fileExt: getFileExtension(file.name) || null,
            fileSizeBytes: file.size,
        });
        throw error;
    }
};

export const updateFileInFirebase = async (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName: string
): Promise<AttachedFile> => {
    return updateFileInFirebaseById(file, patientId, fileId, existingFileName);
};

export const updateFileInFirebaseById = async (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName?: string
): Promise<AttachedFile> => {
    const { uploadBytes, getDownloadURL } = await import("firebase/storage");
    const { storageRef, fileName } = await resolveExistingFileStorageRef(patientId, fileId, existingFileName);

    try {
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type || 'application/octet-stream',
        });
        const downloadUrl = await getDownloadURL(snapshot.ref);

        return {
            id: fileId,
            name: fileName,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            uploadedAt: Date.now(),
            driveUrl: downloadUrl,
            isStarred: false
        };
    } catch (error) {
        emitStructuredLog("error", "FirebaseStorage", "Error updating file", {
            error,
            patientId: anonymizeIdentifier(patientId, 'patient'),
            fileId: anonymizeIdentifier(fileId, 'file'),
            fileExt: getFileExtension(file.name) || null,
            fileSizeBytes: file.size,
        });
        throw error;
    }
};

export const deleteFileFromFirebase = async (patientId: string, fileName: string, fileId: string) => {
    try {
        const { deleteObject } = await import("firebase/storage");
        const { storageRef } = await resolveExistingFileStorageRef(patientId, fileId, fileName);
        await deleteObject(storageRef);
    } catch (error) {
        emitStructuredLog("error", "FirebaseStorage", "Error deleting file", {
            error,
            patientId: anonymizeIdentifier(patientId, 'patient'),
            fileId: anonymizeIdentifier(fileId, 'file'),
        });
    }
};

const isFirebaseStorageHttpUrl = (url: string): boolean => (
    url.includes('firebasestorage.googleapis.com')
);

const STORAGE_PROXY_ENDPOINTS: string[] = import.meta.env.DEV
    ? ['/__local/storage-proxy', '/.netlify/functions/storage-proxy']
    : ['/.netlify/functions/storage-proxy'];

const decodeBase64ToBlob = (base64: string, mimeType: string): Blob => {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
};

const fetchStorageProxyPayload = async (
    endpoint: string,
    url: string
): Promise<{ base64?: string; mimeType?: string }> => {
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, {
        method: 'GET',
        cache: 'no-store',
    });
    if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(`Storage proxy failed (${response.status})${message ? `: ${message}` : ''}`);
    }
    return await response.json() as { base64?: string; mimeType?: string };
};

const downloadFirebaseHttpUrlViaProxy = async (url: string): Promise<Blob> => {
    let lastError: unknown = null;
    for (const endpoint of STORAGE_PROXY_ENDPOINTS) {
        try {
            emitStructuredLog('info', 'StorageProxy', 'Proxy request for storage download', {
                endpoint,
                url: summarizeUrlForLog(url),
            });
            const payload = await fetchStorageProxyPayload(endpoint, url);
            if (!payload?.base64) {
                throw new Error('Storage proxy returned invalid payload');
            }
            return decodeBase64ToBlob(payload.base64, payload.mimeType || 'application/octet-stream');
        } catch (error) {
            lastError = error;
            emitStructuredLog('warn', 'StorageProxy', 'Proxy endpoint failed', {
                endpoint,
                error,
            });
        }
    }
    throw (lastError || new Error('Storage proxy unavailable'));
};

export const downloadFileBlobFromFirebaseUrl = async (url: string): Promise<Blob> => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (isFirebaseStorageHttpUrl(url)) {
            return await downloadFirebaseHttpUrlViaProxy(url);
        }
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to download file (${response.status})`);
        }
        return await response.blob();
    }

    const storage = await getStorageInstance();
    if (!storage) throw new Error("Firebase not configured");
    const { ref, getBlob } = await import("firebase/storage");

    const storageRef = ref(storage, url);
    return await getBlob(storageRef);
};

export const downloadFileBlobFromFirebaseById = async (
    patientId: string,
    fileId: string,
    existingFileName?: string
): Promise<Blob> => {
    emitStructuredLog('info', 'StorageProxy', 'Resolving storage object by identifiers', {
        patientId: anonymizeIdentifier(patientId, 'patient'),
        fileId: anonymizeIdentifier(fileId, 'file'),
        hasExistingFileName: Boolean(existingFileName),
    });
    const { getDownloadURL } = await import("firebase/storage");
    const { storageRef } = await resolveExistingFileStorageRef(patientId, fileId, existingFileName);
    const downloadUrl = await getDownloadURL(storageRef);
    return await downloadFileBlobFromFirebaseUrl(downloadUrl);
};

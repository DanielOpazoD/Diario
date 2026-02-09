import { getAuthInstance } from "./firebase/auth";
import { getStorageInstance } from "./firebase/storage";
import { AttachedFile } from '@shared/types';
import { emitStructuredLog } from "./logger";

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

const resolveStoredFileName = (fileId: string, storageObjectName: string): string => {
    const prefix = `${fileId}_`;
    if (!storageObjectName.startsWith(prefix)) return storageObjectName;
    const resolved = storageObjectName.slice(prefix.length);
    return resolved || storageObjectName;
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
        const expectedName = trimmedName ? `${fileId}_${trimmedName}` : null;
        const matchedRef = (
            (expectedName ? listing.items.find((item) => item.name === expectedName) : null)
            || listing.items.find((item) => item.name.startsWith(`${fileId}_`))
        );
        if (matchedRef) {
            return {
                storageRef: matchedRef,
                fileName: resolveStoredFileName(fileId, matchedRef.name),
            };
        }
    } catch (error) {
        // If listing fails (permissions/network), fallback to deterministic path when filename exists.
    }

    if (trimmedName) {
        return {
            storageRef: ref(storage, `${buildPatientStoragePath(user.uid, patientId)}/${fileId}_${trimmedName}`),
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
    const storageRef = ref(storage, `users/${user.uid}/patients/${patientId}/${fileId}_${file.name}`);

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
        emitStructuredLog("error", "FirebaseStorage", "Error uploading file", { error });
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
        emitStructuredLog("error", "FirebaseStorage", "Error updating file", { error });
        throw error;
    }
};

export const deleteFileFromFirebase = async (patientId: string, fileName: string, fileId: string) => {
    const storage = await getStorageInstance();
    const auth = await getAuthInstance();
    if (!auth || !storage) return;
    const user = auth.currentUser;
    if (!user) return;

    const { ref, deleteObject } = await import("firebase/storage");
    const storageRef = ref(storage, `users/${user.uid}/patients/${patientId}/${fileId}_${fileName}`);

    try {
        await deleteObject(storageRef);
    } catch (error) {
        emitStructuredLog("error", "FirebaseStorage", "Error deleting file", { error });
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
            if (typeof console !== 'undefined') {
                console.info('[ClinicalReportJSON][StorageProxy]', {
                    stage: 'proxy-request',
                    endpoint,
                    url: url.slice(0, 120),
                });
            }
            const payload = await fetchStorageProxyPayload(endpoint, url);
            if (!payload?.base64) {
                throw new Error('Storage proxy returned invalid payload');
            }
            return decodeBase64ToBlob(payload.base64, payload.mimeType || 'application/octet-stream');
        } catch (error) {
            lastError = error;
            if (typeof console !== 'undefined') {
                console.warn('[ClinicalReportJSON][StorageProxy]', {
                    stage: 'proxy-failed',
                    endpoint,
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            }
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
    if (typeof console !== 'undefined') {
        console.info('[ClinicalReportJSON][StorageProxy]', {
            stage: 'by-id-resolve',
            patientId,
            fileId,
            existingFileName: existingFileName || null,
        });
    }
    const { getDownloadURL } = await import("firebase/storage");
    const { storageRef } = await resolveExistingFileStorageRef(patientId, fileId, existingFileName);
    const downloadUrl = await getDownloadURL(storageRef);
    return await downloadFileBlobFromFirebaseUrl(downloadUrl);
};

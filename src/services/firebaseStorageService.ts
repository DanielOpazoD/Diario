import { getAuthInstance } from "./firebase/auth";
import { getStorageInstance } from "./firebase/storage";
import { AttachedFile } from '@shared/types';
import { emitStructuredLog } from "./logger";

export const uploadFileToFirebase = async (
    file: File,
    patientId: string
): Promise<AttachedFile> => {
    const storage = await getStorageInstance();
    const auth = await getAuthInstance();
    if (!auth || !storage) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

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

export const downloadFileBlobFromFirebaseUrl = async (url: string): Promise<Blob> => {
    const storage = await getStorageInstance();
    if (!storage) throw new Error("Firebase not configured");
    const { ref, getBlob } = await import("firebase/storage");

    const storageRef = ref(storage, url);
    return await getBlob(storageRef);
};

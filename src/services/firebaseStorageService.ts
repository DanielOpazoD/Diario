import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { storage, auth } from "./firebaseConfig";
import { AttachedFile } from '@shared/types';
import { emitStructuredLog } from "./logger";

export const uploadFileToFirebase = async (
    file: File,
    patientId: string
): Promise<AttachedFile> => {
    if (!auth || !storage) throw new Error("Firebase not configured");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const fileId = crypto.randomUUID();
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
    if (!auth || !storage) return;
    const user = auth.currentUser;
    if (!user) return;

    const storageRef = ref(storage, `users/${user.uid}/patients/${patientId}/${fileId}_${fileName}`);

    try {
        await deleteObject(storageRef);
    } catch (error) {
        emitStructuredLog("error", "FirebaseStorage", "Error deleting file", { error });
    }
};

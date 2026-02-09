import type { AttachmentsPort } from '@data/ports/attachmentsPort';
import { fileToBase64, downloadUrlAsBase64, downloadUrlAsArrayBuffer } from '@services/storage';
import { extractTextFromPdf } from '@services/pdfText';
import {
  uploadFileToFirebase,
  updateFileInFirebase,
  updateFileInFirebaseById,
  deleteFileFromFirebase,
  downloadFileBlobFromFirebaseUrl,
  downloadFileBlobFromFirebaseById,
} from '@services/firebaseStorageService';

export const attachmentsAdapter: AttachmentsPort = {
  encodeFileToBase64: fileToBase64,
  fetchUrlAsBase64: downloadUrlAsBase64,
  fetchUrlAsArrayBuffer: downloadUrlAsArrayBuffer,
  extractTextFromPdfFile: extractTextFromPdf,
  uploadPatientFile: uploadFileToFirebase,
  updatePatientFile: updateFileInFirebase,
  updatePatientFileById: updateFileInFirebaseById,
  deletePatientFile: deleteFileFromFirebase,
  downloadPatientFileBlob: downloadFileBlobFromFirebaseUrl,
  downloadPatientFileBlobById: downloadFileBlobFromFirebaseById,
};

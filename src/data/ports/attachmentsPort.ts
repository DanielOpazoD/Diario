import type { AttachedFile } from '@shared/types';

export interface AttachmentsPort {
  encodeFileToBase64: (file: File) => Promise<string>;
  fetchUrlAsBase64: (url: string) => Promise<string>;
  fetchUrlAsArrayBuffer: (url: string) => Promise<ArrayBuffer>;
  extractTextFromPdfFile: (buffer: ArrayBuffer) => Promise<string>;
  uploadPatientFile: (file: File, patientId: string) => Promise<AttachedFile>;
  updatePatientFile: (file: File, patientId: string, fileId: string, existingFileName: string) => Promise<AttachedFile>;
  updatePatientFileById: (
    file: File,
    patientId: string,
    fileId: string,
    existingFileName?: string
  ) => Promise<AttachedFile>;
  deletePatientFile: (patientId: string, fileName: string, fileId: string) => Promise<void>;
  downloadPatientFileBlob: (url: string) => Promise<Blob>;
  downloadPatientFileBlobById: (patientId: string, fileId: string, existingFileName?: string) => Promise<Blob>;
}

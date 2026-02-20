import type { AttachmentsPort } from '@data/ports/attachmentsPort';
import { fileToBase64, downloadUrlAsBase64, downloadUrlAsArrayBuffer } from '@services/storage';
import { extractTextFromPdf } from '@services/pdfText';
import { cloudStorageGateway } from '@services/storage/UnifiedCloudStorageGateway';

export const attachmentsAdapter: AttachmentsPort = {
  encodeFileToBase64: fileToBase64,
  fetchUrlAsBase64: downloadUrlAsBase64,
  fetchUrlAsArrayBuffer: downloadUrlAsArrayBuffer,
  extractTextFromPdfFile: extractTextFromPdf,
  uploadPatientFile: cloudStorageGateway.uploadFile.bind(cloudStorageGateway),
  updatePatientFile: cloudStorageGateway.updateFile.bind(cloudStorageGateway),
  updatePatientFileById: cloudStorageGateway.updateFile.bind(cloudStorageGateway),
  listPatientFiles: cloudStorageGateway.listPatientFiles.bind(cloudStorageGateway),
  listAllPatientFiles: cloudStorageGateway.listAllPatientFiles.bind(cloudStorageGateway),
  deletePatientFile: (patientId: string, fileName: string, fileId: string) =>
    cloudStorageGateway.deleteFile(patientId, fileId, fileName),
  downloadPatientFileBlob: cloudStorageGateway.downloadFileAsBlob.bind(cloudStorageGateway),
  downloadPatientFileBlobById: cloudStorageGateway.downloadFileById.bind(cloudStorageGateway),
};

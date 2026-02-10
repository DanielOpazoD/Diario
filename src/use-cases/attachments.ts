import { attachmentsAdapter } from '@data/adapters/attachmentsAdapter';

export const encodeFileToBase64 = attachmentsAdapter.encodeFileToBase64;
export const fetchUrlAsBase64 = attachmentsAdapter.fetchUrlAsBase64;
export const fetchUrlAsArrayBuffer = attachmentsAdapter.fetchUrlAsArrayBuffer;
export const extractTextFromPdfFile = attachmentsAdapter.extractTextFromPdfFile;
export const uploadPatientFile = attachmentsAdapter.uploadPatientFile;
export const updatePatientFile = attachmentsAdapter.updatePatientFile;
export const updatePatientFileById = attachmentsAdapter.updatePatientFileById;
export const listPatientFiles = attachmentsAdapter.listPatientFiles;
export const listAllPatientFiles = attachmentsAdapter.listAllPatientFiles;
export const deletePatientFile = attachmentsAdapter.deletePatientFile;
export const downloadPatientFileBlob = attachmentsAdapter.downloadPatientFileBlob;
export const downloadPatientFileBlobById = attachmentsAdapter.downloadPatientFileBlobById;

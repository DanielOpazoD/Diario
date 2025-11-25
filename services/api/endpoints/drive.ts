import { createHttpClient } from '../client';
import { DriveFile, DriveListResponse } from '../types';
import { buildPaginationParams, withRetry } from '../utils';

const googleClient = createHttpClient({
  baseUrl: 'https://www.googleapis.com',
  defaultHeaders: {},
});

export interface ListFilesRequest {
  q: string;
  fields?: string;
  pageSize?: number;
  supportsAllDrives?: boolean;
  includeItemsFromAllDrives?: boolean;
  corpora?: string;
  driveId?: string;
  orderBy?: string;
  spaces?: string;
}

export const listFiles = (accessToken: string, params: ListFilesRequest, signal?: AbortSignal) =>
  googleClient.get<DriveListResponse>('/drive/v3/files', {
    params,
    authToken: accessToken,
    signal,
  });

export const createFolder = (accessToken: string, body: Partial<DriveFile> & { mimeType: string }, signal?: AbortSignal) =>
  googleClient.post<DriveFile>('/drive/v3/files', JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    authToken: accessToken,
    signal,
  });

export interface UploadMultipartRequest {
  metadata: Record<string, unknown>;
  file: Blob | File;
  fields?: string;
}

export const uploadMultipart = (accessToken: string, payload: UploadMultipartRequest, signal?: AbortSignal) => {
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(payload.metadata)], { type: 'application/json' }));
  form.append('file', payload.file);

  return googleClient.post<DriveFile>('/upload/drive/v3/files', form, {
    params: { uploadType: 'multipart', fields: payload.fields },
    authToken: accessToken,
    headers: {},
    signal,
  });
};

export const markFileAsTrashed = (accessToken: string, fileId: string, signal?: AbortSignal) =>
  googleClient.patch<DriveFile>(`/drive/v3/files/${fileId}`, JSON.stringify({ trashed: true }), {
    headers: { 'Content-Type': 'application/json' },
    authToken: accessToken,
    signal,
  });

export const getFileMetadata = (accessToken: string, fileId: string, fields?: string, signal?: AbortSignal) =>
  googleClient.get<DriveFile>(`/drive/v3/files/${fileId}`, {
    params: { fields, supportsAllDrives: true },
    authToken: accessToken,
    signal,
  });

export const downloadFileContent = async (
  accessToken: string,
  fileId: string,
  asJson = true,
  signal?: AbortSignal
) => {
  const response = await googleClient.get<Response>(`/drive/v3/files/${fileId}`, {
    params: { alt: 'media', supportsAllDrives: true },
    authToken: accessToken,
    signal,
  });

  const contentType = response.headers.get('Content-Type') || '';
  if (!asJson || !contentType.includes('application/json')) {
    return response.data;
  }

  return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
};

export const downloadFileAsBase64 = async (accessToken: string, fileId: string, signal?: AbortSignal) => {
  const res = await googleClient.get<Blob>(`/drive/v3/files/${fileId}`, {
    params: { alt: 'media', supportsAllDrives: true },
    authToken: accessToken,
    headers: {},
    responseType: 'blob',
    signal,
  });

  const blob = res.data as unknown as Blob;
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getUserInfo = (accessToken: string, signal?: AbortSignal) =>
  googleClient.get<Record<string, unknown>>('/oauth2/v3/userinfo', {
    authToken: accessToken,
    signal,
  });

export const listFilesWithRetry = (
  accessToken: string,
  params: ListFilesRequest,
  pagination?: PaginationParams,
  signal?: AbortSignal
) => {
  const queryParams = {
    ...params,
    ...buildPaginationParams(pagination),
  };

  return withRetry(() => listFiles(accessToken, queryParams, signal), 1, 400, signal);
};

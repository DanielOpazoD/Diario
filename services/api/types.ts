export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  url: string;
  method?: HttpMethod;
  baseUrl?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: BodyInit | null;
  authToken?: string | null;
  signal?: AbortSignal;
  responseType?: 'json' | 'text' | 'blob';
}

export interface HttpClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | null;
}

export interface ApiResponse<T> {
  status: number;
  data: T;
  headers: Headers;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  details?: unknown;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  code?: string;

  constructor({ status, message, details, code }: ApiErrorPayload) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
  driveId?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

export interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

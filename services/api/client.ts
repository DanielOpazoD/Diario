import { ApiError, ApiErrorPayload, ApiResponse, HttpClientConfig, RequestConfig } from './types';

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

const normalizeError = async (response: Response): Promise<ApiError> => {
  let payload: ApiErrorPayload = {
    status: response.status,
    message: response.statusText || 'Request failed',
  };

  try {
    const data = await response.json();
    payload = {
      status: response.status,
      message: data?.error?.message || data?.message || payload.message,
      details: data,
      code: data?.error?.code || data?.code,
    };
  } catch (_) {
    // ignore parse errors, we already have the payload
  }

  return new ApiError(payload);
};

export const createHttpClient = (config: HttpClientConfig = {}) => {
  const baseUrl = config.baseUrl || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined) || '/api';
  const defaultHeaders = config.defaultHeaders || { 'Content-Type': 'application/json' };
  const getAuthToken = config.getAuthToken || (() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('medidiario_token');
    }
    return null;
  });

  const requestInterceptors: Array<(cfg: RequestConfig) => Promise<RequestConfig> | RequestConfig> = [];
  const responseInterceptors: Array<(res: Response) => Promise<Response> | Response> = [];

  const applyInterceptors = async (cfg: RequestConfig): Promise<RequestConfig> => {
    let current = cfg;
    for (const interceptor of requestInterceptors) {
      current = await interceptor(current);
    }
    return current;
  };

  const applyResponseInterceptors = async (res: Response): Promise<Response> => {
    let current = res;
    for (const interceptor of responseInterceptors) {
      current = await interceptor(current);
    }
    return current;
  };

  const buildUrl = (cfg: RequestConfig) => {
    const finalBase = cfg.baseUrl || baseUrl;
    const target = isAbsoluteUrl(cfg.url) ? cfg.url : `${finalBase}${cfg.url}`;

    if (!cfg.params) return target;

    const searchParams = new URLSearchParams();
    Object.entries(cfg.params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${target}?${queryString}` : target;
  };

  const request = async <T>(cfg: RequestConfig): Promise<ApiResponse<T>> => {
    const mergedConfig: RequestConfig = {
      method: 'GET',
      ...cfg,
      headers: { ...defaultHeaders, ...cfg.headers },
    };

    const finalConfig = await applyInterceptors(mergedConfig);

    const authToken = finalConfig.authToken ?? getAuthToken();
    if (authToken && !('Authorization' in (finalConfig.headers || {}))) {
      finalConfig.headers = {
        ...finalConfig.headers,
        Authorization: `Bearer ${authToken}`,
      };
    }

    const url = buildUrl(finalConfig);

    const response = await fetch(url, {
      method: finalConfig.method,
      headers: finalConfig.headers,
      body: finalConfig.body,
      signal: finalConfig.signal,
    });

    const interceptedResponse = await applyResponseInterceptors(response as Response);

    const responseHeaders = interceptedResponse.headers instanceof Headers
      ? interceptedResponse.headers
      : new Headers((interceptedResponse as any).headers || {});

    if (!interceptedResponse.ok) {
      throw await normalizeError(interceptedResponse);
    }

    const contentType = responseHeaders.get('Content-Type') || '';
    const resAny = interceptedResponse as any;
    const responseType =
      finalConfig.responseType
      || (typeof resAny.json === 'function'
        ? 'json'
        : contentType.includes('application/json')
          ? 'json'
          : 'text');

    let data: any;
    if (responseType === 'blob') {
      data = typeof resAny.blob === 'function' ? await resAny.blob() : resAny.body;
    } else if (responseType === 'json') {
      data = typeof resAny.json === 'function' ? await resAny.json() : JSON.parse(resAny.body ?? 'null');
    } else {
      if (typeof resAny.text === 'function') {
        data = await resAny.text();
      } else if (resAny.body) {
        data = String(resAny.body);
      } else if (typeof resAny.json === 'function') {
        data = JSON.stringify(await resAny.json());
      } else {
        data = '';
      }
    }

    return {
      status: interceptedResponse.status,
      data: data as T,
      headers: responseHeaders,
    };
  };

  const get = <T>(url: string, cfg?: Omit<RequestConfig, 'url' | 'method'>) =>
    request<T>({ ...cfg, url, method: 'GET' });

  const post = <T>(url: string, body?: BodyInit | null, cfg?: Omit<RequestConfig, 'url' | 'method' | 'body'>) =>
    request<T>({ ...cfg, url, method: 'POST', body });

  const patch = <T>(url: string, body?: BodyInit | null, cfg?: Omit<RequestConfig, 'url' | 'method' | 'body'>) =>
    request<T>({ ...cfg, url, method: 'PATCH', body });

  const del = <T>(url: string, cfg?: Omit<RequestConfig, 'url' | 'method'>) =>
    request<T>({ ...cfg, url, method: 'DELETE' });

  return {
    get,
    post,
    patch,
    delete: del,
    addRequestInterceptor: (interceptor: (cfg: RequestConfig) => Promise<RequestConfig> | RequestConfig) => {
      requestInterceptors.push(interceptor);
    },
    addResponseInterceptor: (interceptor: (res: Response) => Promise<Response> | Response) => {
      responseInterceptors.push(interceptor);
    },
  };
};

export const httpClient = createHttpClient();

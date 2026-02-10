const TOKEN_QUERY_PARAMS = new Set([
  'token',
  'auth',
  'authorization',
  'apikey',
  'api_key',
  'key',
  'signature',
  'sig',
]);

const normalizeString = (value: string) => value.trim();

const fnv1a = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const anonymizeIdentifier = (value: string | null | undefined, prefix = 'id') => {
  const normalized = normalizeString(value || '');
  if (!normalized) return `${prefix}#unknown`;
  return `${prefix}#${fnv1a(normalized)}`;
};

export const sanitizeUrlForLog = (value: string) => {
  const normalized = normalizeString(value);
  if (!normalized) return normalized;

  try {
    const parsed = new URL(normalized);
    parsed.searchParams.forEach((_, key) => {
      if (TOKEN_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    });
    return parsed.toString();
  } catch {
    return normalized.replace(/([?&](token|auth|authorization|apikey|api_key|key|signature|sig)=)[^&]+/gi, '$1[REDACTED]');
  }
};

export const summarizeUrlForLog = (value: string) => {
  const normalized = sanitizeUrlForLog(value);
  try {
    const parsed = new URL(normalized);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return normalized.slice(0, 160);
  }
};

type ErrorLike = Error & {
  code?: string;
  status?: number;
  statusCode?: number;
  response?: {
    status?: number;
    statusCode?: number;
  };
};

export const sanitizeErrorForLog = (error: unknown) => {
  if (error instanceof Error) {
    const enriched = error as ErrorLike;
    return {
      name: enriched.name,
      message: sanitizeUrlForLog(enriched.message),
      code: enriched.code,
      status: enriched.status ?? enriched.statusCode ?? enriched.response?.status ?? enriched.response?.statusCode,
    };
  }
  if (typeof error === 'string') {
    return sanitizeUrlForLog(error);
  }
  return error;
};


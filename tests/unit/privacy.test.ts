import { describe, expect, it } from 'vitest';
import {
  anonymizeIdentifier,
  sanitizeErrorForLog,
  sanitizeUrlForLog,
  summarizeUrlForLog,
} from '@shared/utils/privacy';

describe('privacy utils', () => {
  it('anonymizeIdentifier is deterministic and handles empty values', () => {
    const a = anonymizeIdentifier(' patient-123 ', 'patient');
    const b = anonymizeIdentifier('patient-123', 'patient');
    expect(a).toBe(b);
    expect(a).toMatch(/^patient#[a-f0-9]{8}$/);
    expect(anonymizeIdentifier('', 'patient')).toBe('patient#unknown');
  });

  it('sanitizeUrlForLog redacts sensitive query params in valid URLs', () => {
    const sanitized = sanitizeUrlForLog(
      'https://x.com/file.pdf?token=abc123&key=k9&other=ok'
    );
    expect(sanitized).toContain('token=%5BREDACTED%5D');
    expect(sanitized).toContain('key=%5BREDACTED%5D');
    expect(sanitized).toContain('other=ok');
  });

  it('sanitizeUrlForLog redacts in non-URL strings using regex fallback', () => {
    const sanitized = sanitizeUrlForLog('download?token=abc&sig=123');
    expect(sanitized).toBe('download?token=[REDACTED]&sig=[REDACTED]');
  });

  it('summarizeUrlForLog returns origin + path and fallback slices plain strings', () => {
    expect(summarizeUrlForLog('https://x.com/a/b?token=abc')).toBe('https://x.com/a/b');

    const plain = 'plain-text-value';
    expect(summarizeUrlForLog(plain)).toBe(plain);
  });

  it('sanitizeErrorForLog normalizes Error and string inputs', () => {
    const error = new Error('failed https://x.com?token=abc') as Error & { code?: string; status?: number };
    error.code = 'E_FAIL';
    error.status = 500;

    const normalizedError = sanitizeErrorForLog(error) as {
      message: string;
      code: string;
      status: number;
    };

    expect(normalizedError.message).toContain('token=[REDACTED]');
    expect(normalizedError.code).toBe('E_FAIL');
    expect(normalizedError.status).toBe(500);

    const normalizedString = sanitizeErrorForLog('bad?authorization=secret');
    expect(normalizedString).toBe('bad?authorization=[REDACTED]');
  });
});

import { describe, expect, it, vi } from 'vitest';

describe('logger', () => {
  it('uses existing session id from sessionStorage', async () => {
    vi.resetModules();
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => 'session-1'),
      setItem: vi.fn(),
    });
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-1') });

    const { emitStructuredLog, getSessionId } = await import('@services/logger');

    expect(getSessionId()).toBe('session-1');
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const entry = emitStructuredLog('info', 'Test', 'Hello');
    expect(entry.sessionId).toBe('session-1');
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
  });

  it('creates and stores session id when missing', async () => {
    vi.resetModules();
    const setItem = vi.fn();
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => null),
      setItem,
    });
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-2') });

    const { getSessionId } = await import('@services/logger');
    expect(getSessionId()).toBe('uuid-2');
    expect(setItem).toHaveBeenCalledWith('medidiario_session_id', 'uuid-2');
  });

  it('falls back when sessionStorage throws', async () => {
    vi.resetModules();
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => {
        throw new Error('nope');
      }),
      setItem: vi.fn(() => {
        throw new Error('nope');
      }),
    });
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'uuid-3') });

    const { getSessionId, emitStructuredLog } = await import('@services/logger');
    expect(getSessionId()).toBe('uuid-3');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const entry = emitStructuredLog('error', 'Test', 'Fail');
    expect(entry.sessionId).toBe('uuid-3');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

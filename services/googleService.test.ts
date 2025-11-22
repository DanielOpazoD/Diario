import { restoreStoredToken, listFolderEntries } from './googleService';

const createResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('restoreStoredToken', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('prioritizes the in-memory session token', () => {
    sessionStorage.setItem('google_access_token', 'session-token');
    localStorage.setItem('medidiario_google_token', JSON.stringify({
      accessToken: 'stored-token',
      version: 'v2',
      expiresAt: Date.now() + 10_000
    }));

    const token = restoreStoredToken();

    expect(token).toBe('session-token');
    expect(sessionStorage.getItem('google_access_token')).toBe('session-token');
  });

  it('restores a valid persisted token into session storage', () => {
    const payload = {
      accessToken: 'persisted-token',
      version: 'v2',
      expiresAt: Date.now() + 10_000
    };
    localStorage.setItem('medidiario_google_token', JSON.stringify(payload));

    const token = restoreStoredToken();

    expect(token).toBe('persisted-token');
    expect(sessionStorage.getItem('google_access_token')).toBe('persisted-token');
  });

  it('rejects tokens with mismatched version or expiration', () => {
    const oldPayload = { accessToken: 'old', version: 'v1', expiresAt: Date.now() + 10_000 };
    localStorage.setItem('medidiario_google_token', JSON.stringify(oldPayload));
    expect(restoreStoredToken()).toBeNull();
    expect(localStorage.getItem('medidiario_google_token')).toBeNull();

    const expiredPayload = { accessToken: 'expired', version: 'v2', expiresAt: Date.now() - 1000 };
    localStorage.setItem('medidiario_google_token', JSON.stringify(expiredPayload));
    expect(restoreStoredToken()).toBeNull();
    expect(localStorage.getItem('medidiario_google_token')).toBeNull();
  });
});

describe('listFolderEntries', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('retries with relaxed parameters after invalid value errors', async () => {
    const calls: URL[] = [];
    global.fetch = vi.fn((url: string) => {
      const parsed = new URL(url);
      calls.push(parsed);

      const orderBy = parsed.searchParams.get('orderBy');
      if (calls.length === 1 && orderBy) {
        return Promise.resolve(createResponse({ error: { message: 'Invalid Value' } }, 400));
      }

      return Promise.resolve(createResponse({ files: [{ id: '1', name: 'file' }] }));
    }) as any;

    const response = await listFolderEntries('token');

    expect(response.files).toHaveLength(1);
    expect(calls.length).toBe(2);
    expect(calls[0].searchParams.get('orderBy')).toBe('mimeType desc, name');
    expect(calls[1].searchParams.get('orderBy')).toBeNull();
  });

  it('propagates non-retryable errors', async () => {
    global.fetch = vi.fn(() => Promise.resolve(createResponse({ error: { message: 'Server error' } }, 500))) as any;

    await expect(listFolderEntries('token')).rejects.toThrow('Server error');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

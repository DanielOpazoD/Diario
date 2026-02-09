type StoredToken = {
  accessToken: string;
  expiresAt: number;
  version?: string;
};

const SESSION_TOKEN_KEY = 'google_access_token';
const LOCAL_TOKEN_KEY = 'medidiario_google_token';

const readStoredToken = (): StoredToken | null => {
  try {
    const raw = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
};

const clearStoredToken = () => {
  try {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
};

export const restoreStoredToken = (): string | null => {
  try {
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (sessionToken) return sessionToken;
  } catch {
    // ignore session storage errors
  }

  const stored = readStoredToken();
  if (!stored || !stored.accessToken || !stored.expiresAt) {
    return null;
  }

  if (stored.expiresAt <= Date.now()) {
    clearStoredToken();
    return null;
  }

  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, stored.accessToken);
  } catch {
    // ignore session storage errors
  }
  return stored.accessToken;
};

export const listFolderEntries = async (accessToken: string, folderId?: string) => {
  const query = folderId ? `'${folderId}' in parents and trashed = false` : 'trashed = false';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)`;

  let attempts = 0;
  while (attempts < 2) {
    attempts += 1;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }

    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message ?? '';
    if (response.status === 400 && message.includes('Invalid Value') && attempts < 2) {
      continue;
    }

    const error = new Error(message || 'Google Drive request failed');
    (error as any).status = response.status;
    throw error;
  }
  return { files: [] };
};

export const uploadFileToDrive = async (
  fileContent: string,
  fileName: string,
  accessToken: string,
  appName: string,
  folderId?: string
) => {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
    description: `${appName} backup`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`,
    }),
    body: form,
  });

  return await response.json();
};

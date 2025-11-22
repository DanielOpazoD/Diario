
// Service to handle Google Auth and Drive API

import { AttachedFile } from "../types";

const resolveClientId = () => {
  if (typeof import.meta !== 'undefined') {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  return '';
};

// Fallback safe access for Client ID
const CLIENT_ID = resolveClientId() || '752346610228-e9grkodnhi6lkau35fhuidapovp366id.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file email profile';
const TOKEN_STORAGE_KEY = 'medidiario_google_token';

interface StoredToken {
  accessToken: string;
  expiresAt?: number;
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
// Variable global para almacenar el 'reject' de la promesa de login actual
let activeLoginReject: ((reason?: any) => void) | null = null;

const persistGoogleToken = (token: string, expiresIn?: number) => {
  try {
    sessionStorage.setItem('google_access_token', token);

    const payload: StoredToken = { accessToken: token };

    if (expiresIn) {
      payload.expiresAt = Date.now() + expiresIn * 1000;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('No se pudo guardar el token de Google en almacenamiento persistente', error);
  }
};

export const restoreStoredToken = (): string | null => {
  // Priorizar el token en memoria de la sesión si existe
  const active = sessionStorage.getItem('google_access_token');
  if (active) return active;

  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredToken;

    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

    if (parsed.accessToken) {
      sessionStorage.setItem('google_access_token', parsed.accessToken);
      return parsed.accessToken;
    }
  } catch (error) {
    console.warn('No se pudo leer el token almacenado de Google', error);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  return null;
};

export const getActiveAccessToken = () => {
  return restoreStoredToken();
};

export const clearStoredToken = () => {
  sessionStorage.removeItem('google_access_token');
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime?: string;
  size?: string;
}

export const checkGoogleConfig = () => {
  return !!CLIENT_ID;
};

export const initGoogleApi = (onInit: () => void) => {
  if (!CLIENT_ID) return;

  // Retry mechanism in case scripts are loading slowly from CDN
  const checkAndInit = () => {
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google) {
      // Scripts not loaded yet, retry in 200ms
      setTimeout(checkAndInit, 200);
      return;
    }

    if (!gapiInited) {
        gapi.load('client', async () => {
            await gapi.client.init({
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            gapiInited = true;
            if (gisInited) onInit();
        });
    }
    
    if (!gisInited) {
        try {
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (_resp: any) => { /* Initial dummy callback */ },
            error_callback: (err: any) => {
              // Fix: Filter out expected user cancellations from console noise
              if (err?.type !== 'popup_closed') {
                console.error("Google Identity Service Error:", err);
              }
              
              // Si hay un intento de login activo, lo rechazamos con el error capturado
              if (activeLoginReject) {
                activeLoginReject(err);
                activeLoginReject = null;
              }
            }
          });
          gisInited = true;
          if (gapiInited) onInit();
        } catch (e) {
          console.error("Error initializing Google Token Client:", e);
        }
    }
  };
  
  checkAndInit();
};

export const handleGoogleLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Clean up previous rejection if new request comes in
    if (activeLoginReject) {
       const err = new Error("New login request started");
       (err as any).type = 'popup_closed'; 
       activeLoginReject(err);
    }
    
    // Guardamos la referencia a reject para usarla si el popup se cierra
    activeLoginReject = reject;

    if (!tokenClient) {
      // Attempt one last lazy init or fail
      const google = (window as any).google;
      if (google && CLIENT_ID) {
         try {
           tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: CLIENT_ID,
              scope: SCOPES,
              callback: (_resp: any) => {}, // Placeholder
              error_callback: (err: any) => {
                 if (err?.type !== 'popup_closed') {
                    console.error("Google Identity Service Error (Lazy Init):", err);
                 }
                 if (activeLoginReject) {
                    activeLoginReject(err);
                    activeLoginReject = null;
                 }
              }
           });
         } catch (e) {
           activeLoginReject = null;
           reject("Error al inicializar el cliente de Google. Recarga la página.");
           return;
         }
      } else {
         activeLoginReject = null;
         reject("Google API not initialized. Reload the page or check connection.");
         return;
      }
    }

    // Sobrescribimos el callback para esta petición específica
    tokenClient.callback = async (resp: any) => {
      activeLoginReject = null; // Limpiamos el reject global porque ya tuvimos respuesta
      if (resp.error !== undefined) {
        reject(resp);
      }
      persistGoogleToken(resp.access_token, resp.expires_in);
      resolve(resp.access_token);
    };

    try {
      // Prompt the user to select a Google Account
      if ((window as any).gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
        tokenClient.requestAccessToken({prompt: ''});
      }
    } catch (e) {
      activeLoginReject = null;
      reject(e);
    }
  });
};

const findOrCreateFolder = async (folderName: string, accessToken: string, parentId?: string): Promise<string> => {
  // 1. Search for the folder
  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  // Ensure we escape single quotes in folder name to prevent query injection/errors
  const safeName = folderName.replace(/'/g, "\\'");
  
  let query = `mimeType='application/vnd.google-apps.folder' and name='${safeName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  searchUrl.searchParams.append('q', query);
  searchUrl.searchParams.append('fields', 'files(id, name)');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Create if not exists
  const createMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  if (parentId) {
    createMetadata.parents = [parentId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createMetadata)
  });

  const createData = await createRes.json();
  return createData.id;
};

export const uploadFileToDrive = async (
  content: string,
  filename: string,
  accessToken: string,
  folderName: string = "MediDiario",
  folderId?: string | null
) => {
  let resolvedFolderId: string | null = folderId || null;

  try {
    if (!resolvedFolderId) {
      resolvedFolderId = await findOrCreateFolder(folderName, accessToken);
    }
  } catch (e) {
    console.error("Could not resolve folder, uploading to root", e);
  }

  const file = new Blob([content], {type: 'application/json'});
  const metadata: any = {
    name: filename,
    mimeType: 'application/json',
  };

  if (resolvedFolderId) {
    metadata.parents = [resolvedFolderId];
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  return await response.json();
};

export const uploadFileForPatient = async (
  file: File, 
  patientRut: string, 
  patientName: string, 
  accessToken: string
): Promise<AttachedFile> => {
  // 1. Ensure Directory Structure: MediDiario/Pacientes/{RUT}-{Nombre}/
  const rootId = await findOrCreateFolder("MediDiario", accessToken);
  const pacientesId = await findOrCreateFolder("Pacientes", accessToken, rootId);
  
  const safeFolder = `${patientRut || 'SinRut'}-${patientName || 'SinNombre'}`.replace(/\//g, '-');
  const patientFolderId = await findOrCreateFolder(safeFolder, accessToken, pacientesId);

  // 2. Prepare Metadata
  const datePrefix = new Date().toISOString().split('T')[0];
  const fileName = `${datePrefix}_${file.name}`;
  
  const metadata = {
    name: fileName,
    parents: [patientFolderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', file);

  // 3. Upload
  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,webViewLink,thumbnailLink', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Error uploading file");
  }

  const data = await response.json();
  
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: parseInt(data.size),
    uploadedAt: new Date(data.createdTime).getTime(),
    driveUrl: data.webViewLink,
    thumbnailLink: data.thumbnailLink
  };
};

export const deleteFileFromDrive = async (fileId: string, accessToken: string) => {
  // We use 'trash' instead of delete to be safe
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trashed: true })
  });

  if (!response.ok) {
    throw new Error("Error deleting file from Drive");
  }
};

const buildParentClause = (parentId?: string) => parentId ? `'${parentId}' in parents` : "'root' in parents";

export const listFolderEntries = async (accessToken: string, parentId?: string) => {
  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  const parentClause = buildParentClause(parentId);
  const filters = [
    "trashed=false",
    parentClause,
    "(mimeType='application/vnd.google-apps.folder' or mimeType='application/json')"
  ];

  searchUrl.searchParams.append('q', filters.join(' and '));
  searchUrl.searchParams.append('fields', 'files(id, name, mimeType, parents, modifiedTime, size)');
  searchUrl.searchParams.append('orderBy', 'mimeType desc, name');

  const response = await fetch(searchUrl.toString(), {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  if (!response.ok) {
    throw new Error('Failed to list folder entries');
  }

  return await response.json();
};

export const listFolders = async (accessToken: string, parentId?: string) => {
  const searchUrl = new URL('https://www.googleapis.com/drive/v3/files');
  const parentClause = buildParentClause(parentId);

  searchUrl.searchParams.append('q', `${parentClause} and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  searchUrl.searchParams.append('fields', 'files(id, name, parents)');
  searchUrl.searchParams.append('orderBy', 'name');
  searchUrl.searchParams.append('pageSize', '50');

  const response = await fetch(searchUrl.toString(), {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  if (!response.ok) {
    return { files: [] };
  }

  return await response.json();
};

export const getFolderMetadata = async (accessToken: string, folderId: string) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,parents`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  if (!response.ok) {
    throw new Error('Failed to read folder info');
  }

  return await response.json();
};

export const downloadFile = async (fileId: string, accessToken: string) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });
  
  if (!response.ok) {
    throw new Error('Failed to download file');
  }
  
  return await response.json();
};

export const downloadFileAsBase64 = async (fileId: string, accessToken: string): Promise<string> => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  if (!response.ok) {
    throw new Error('Failed to download file content');
  }

  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove "data:mime/type;base64," prefix
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getUserInfo = async (accessToken: string) => {
   try {
     const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
       headers: { 'Authorization': `Bearer ${accessToken}` }
     });
     if (!response.ok) {
       throw new Error(`Failed to fetch user info: ${response.statusText}`);
     }
     return await response.json();
   } catch (error) {
     console.error("Error fetching user info:", error);
     throw error;
   }
}


// Service to handle Google Auth and Drive API

import { AttachedFile } from "../types";
import {
  createFolder,
  downloadFileAsBase64 as driveDownloadBase64,
  downloadFileContent as driveDownloadContent,
  getFileMetadata,
  getUserInfo as driveUserInfo,
  listFiles,
  listFilesWithRetry,
  markFileAsTrashed,
  uploadMultipart,
} from './api/endpoints/drive';

const resolveClientId = () => {
  if (typeof import.meta !== 'undefined') {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  }

  return '';
};

// Fallback safe access for Client ID
const CLIENT_ID = resolveClientId() || '752346610228-e9grkodnhi6lkau35fhuidapovp366id.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
].join(' ');
const TOKEN_STORAGE_KEY = 'medidiario_google_token';
const TOKEN_VERSION = 'v2';

interface StoredToken {
  accessToken: string;
  expiresAt?: number;
  version?: string;
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
// Variable global para almacenar el 'reject' de la promesa de login actual
let activeLoginReject: ((reason?: any) => void) | null = null;

const persistGoogleToken = (token: string, expiresIn?: number) => {
  try {
    sessionStorage.setItem('google_access_token', token);

    const payload: StoredToken = { accessToken: token, version: TOKEN_VERSION };

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

    if (!parsed.version || parsed.version !== TOKEN_VERSION) {
      sessionStorage.removeItem('google_access_token');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }

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
  driveId?: string;
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
  const safeName = folderName.replace(/'/g, "\\'");

  const searchQuery = [`mimeType='application/vnd.google-apps.folder'`, `name='${safeName}'`, 'trashed=false'];
  if (parentId) {
    searchQuery.push(`'${parentId}' in parents`);
  }

  const existing = await listFiles(accessToken, {
    q: searchQuery.join(' and '),
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const createMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId) {
    createMetadata.parents = [parentId];
  }

  const created = await createFolder(accessToken, createMetadata);
  return created.data.id;
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

  const response = await uploadMultipart(accessToken, { metadata, file });
  return response.data;
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

  const { data } = await uploadMultipart(accessToken, {
    metadata,
    file,
    fields: 'id,name,mimeType,size,createdTime,webViewLink,thumbnailLink',
  });
  
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
  await markFileAsTrashed(accessToken, fileId);
};

const buildParentClause = (parentId?: string) => parentId ? `'${parentId}' in parents` : "'root' in parents";

interface ListOptions {
  relaxed?: boolean;
  corpora?: string;
  driveId?: string;
}

const buildListQuery = (parentId?: string, options?: ListOptions) => {
  const parentClause = buildParentClause(parentId);
  const filters = [
    "trashed=false",
    parentClause
  ];

  const params: any = {
    q: filters.join(' and '),
    fields: 'files(id, name, mimeType, parents, modifiedTime, size)',
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };

  if (options?.corpora) {
    params.corpora = options.corpora;
  }

  if (options?.driveId) {
    params.driveId = options.driveId;
  }

  if (!options?.relaxed) {
    params.spaces = 'drive';
    params.orderBy = 'mimeType desc, name';
  }

  return params;
};

const isInvalidValueError = (err: any) => {
  const message = (err?.message || '').toLowerCase();
  return message.includes('invalid value') || err?.status === 400;
};

export const listFolderEntries = async (accessToken: string, parentId?: string, driveId?: string | null) => {
  const driveScope = driveId || undefined;
  const attempts = [
    buildListQuery(parentId, { corpora: driveScope ? 'drive' : 'allDrives', driveId: driveScope, relaxed: !!driveScope }),
    buildListQuery(parentId, { relaxed: true }),
    driveScope ? buildListQuery(parentId, { corpora: 'drive', driveId: driveScope, relaxed: true }) : null,
    buildListQuery(parentId, { corpora: 'user', relaxed: true }),
  ].filter(Boolean) as any[];

  let lastError: any = null;

  for (const url of attempts) {
    try {
      const response = await listFilesWithRetry(accessToken, url, undefined);
      return response.data;
    } catch (err: any) {
      lastError = err;
      if (!isInvalidValueError(err)) {
        throw err;
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error('No se pudo obtener el listado de Drive');
};

export const listFolders = async (accessToken: string, parentId?: string) => {
  const parentClause = buildParentClause(parentId);
  const response = await listFiles(accessToken, {
    q: `${parentClause} and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name, parents)',
    orderBy: 'name',
    pageSize: 50,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    spaces: 'drive',
  });

  return response.data;
};

export const getFolderMetadata = async (accessToken: string, folderId: string) => {
  const response = await getFileMetadata(accessToken, folderId, 'id,name,parents,driveId,mimeType');
  return response.data;
};

export const downloadFile = async (fileId: string, accessToken: string) => {
  return await driveDownloadContent(accessToken, fileId);
};

export const downloadFileAsBase64 = async (fileId: string, accessToken: string): Promise<string> => {
  return driveDownloadBase64(accessToken, fileId);
};

export const getUserInfo = async (accessToken: string) => {
   try {
     const response = await driveUserInfo(accessToken);
     return response.data;
   } catch (error) {
     console.error("Error fetching user info:", error);
     throw error;
   }
}

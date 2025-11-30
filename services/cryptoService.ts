import { DriveFolderPreference } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof btoa === 'function') {
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
};

const base64ToBuffer = (base64: string) => {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return Buffer.from(base64, 'base64').buffer;
};

const getSubtleCrypto = () => {
  const globalCrypto = globalThis.crypto as Crypto | undefined;
  const subtle = globalCrypto?.subtle || (globalCrypto as any)?.webcrypto?.subtle;
  if (!subtle) {
    throw new Error('El navegador no soporta WebCrypto (AES-GCM).');
  }
  return subtle as SubtleCrypto;
};

export const deriveMasterKey = async (password: string, email: string): Promise<CryptoKey> => {
  const subtle = getSubtleCrypto();
  const keyMaterial = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(email.toLowerCase()),
      iterations: 200000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export interface EncryptedBackupPayload {
  type: 'medidiario-secure-backup';
  version: 1;
  email: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
  folder?: DriveFolderPreference;
}

export const encryptBackupPayload = async (
  payload: unknown,
  key: CryptoKey,
  email: string,
  folder?: DriveFolderPreference
): Promise<EncryptedBackupPayload> => {
  const subtle = getSubtleCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const serialized = encoder.encode(JSON.stringify(payload));
  const additionalData = encoder.encode(email.toLowerCase());
  const cipherBuffer = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, serialized);

  return {
    type: 'medidiario-secure-backup',
    version: 1,
    email,
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(cipherBuffer),
    createdAt: new Date().toISOString(),
    folder,
  };
};

export const isEncryptedBackup = (value: any): value is EncryptedBackupPayload =>
  Boolean(
    value &&
      typeof value === 'object' &&
      value.type === 'medidiario-secure-backup' &&
      typeof value.ciphertext === 'string' &&
      typeof value.iv === 'string'
  );

export const decryptBackupPayload = async <T>(
  payload: EncryptedBackupPayload,
  key: CryptoKey,
  email: string
): Promise<T> => {
  const subtle = getSubtleCrypto();
  if (payload.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('Este respaldo fue cifrado con otra cuenta de correo.');
  }

  const iv = base64ToBuffer(payload.iv);
  const cipherBuffer = base64ToBuffer(payload.ciphertext);
  const additionalData = encoder.encode(email.toLowerCase());
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv, additionalData }, key, cipherBuffer);
  const decoded = decoder.decode(decrypted);
  return JSON.parse(decoded) as T;
};

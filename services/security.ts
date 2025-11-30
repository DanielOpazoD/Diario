import { EncryptedBackupPayload } from '../types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const deriveKey = async (masterKey: string, email: string, salt: Uint8Array) => {
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(masterKey), 'PBKDF2', false, ['deriveKey']);
  const emailSalt = encoder.encode(`medidiario|${email.toLowerCase()}|`);
  const combinedSalt = new Uint8Array(emailSalt.length + salt.length);
  combinedSalt.set(emailSalt);
  combinedSalt.set(salt, emailSalt.length);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: combinedSalt,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptBackupPayload = async (masterKey: string, email: string, payload: unknown): Promise<EncryptedBackupPayload> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(masterKey, email, salt);
  const encoded = encoder.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    version: 1,
    algorithm: 'AES-GCM',
    iv: toBase64(iv),
    salt: toBase64(salt),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    email: email.toLowerCase(),
    createdAt: Date.now(),
  };
};

export const decryptBackupPayload = async (
  masterKey: string,
  email: string,
  encrypted: EncryptedBackupPayload
): Promise<any> => {
  if (encrypted.email !== email.toLowerCase()) {
    throw new Error('La copia de seguridad pertenece a otra cuenta.');
  }

  const iv = fromBase64(encrypted.iv);
  const salt = fromBase64(encrypted.salt);
  const key = await deriveKey(masterKey, email, salt);
  const decoded = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, fromBase64(encrypted.ciphertext));
  const text = decoder.decode(decoded);

  return JSON.parse(text);
};

export const isEncryptedBackup = (value: any): value is { encryptedBackup: EncryptedBackupPayload } => {
  return Boolean(value?.encryptedBackup?.ciphertext && value?.encryptedBackup?.iv && value?.encryptedBackup?.salt);
};

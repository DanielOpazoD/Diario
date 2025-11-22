import { PatientRecord } from '../types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBuffer = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const generateSalt = (length = 16) => {
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
};

export const deriveKeyFromPin = async (pin: string, salt?: Uint8Array) => {
  const saltBytes = new Uint8Array(salt ?? generateSalt());
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return { key, salt: saltBytes };
};

export interface EncryptedPatientPayload {
  iv: string;
  data: string;
}

export const encryptPatientRecord = async (
  record: PatientRecord,
  key: CryptoKey
): Promise<EncryptedPatientPayload> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = textEncoder.encode(JSON.stringify(record));
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return {
    iv: bufferToBase64(iv),
    data: bufferToBase64(cipherBuffer)
  };
};

export const decryptPatientRecord = async (
  payload: EncryptedPatientPayload,
  key: CryptoKey
): Promise<PatientRecord> => {
  const ivBuffer = new Uint8Array(base64ToBuffer(payload.iv));
  const cipherBuffer = base64ToBuffer(payload.data);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuffer }, key, cipherBuffer);
  const json = textDecoder.decode(plaintext);
  return JSON.parse(json);
};

export const exportKeyToBase64 = async (key: CryptoKey) => {
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(raw);
};

export const importKeyFromBase64 = async (serializedKey: string) => {
  const raw = base64ToBuffer(serializedKey);
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt'
  ]);
};

export const serializeSalt = (salt: Uint8Array) => bufferToBase64(salt);
export const deserializeSalt = (salt: string) => new Uint8Array(base64ToBuffer(salt));

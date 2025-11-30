const textEncoder = new TextEncoder();

const getCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto?.subtle) return window.crypto.subtle;
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  throw new Error('WebCrypto API no disponible');
};

const bytesToBase64 = (bytes: ArrayBuffer) => {
  const uint8Array = new Uint8Array(bytes);
  let binary = '';
  uint8Array.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBytes = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

const deriveKeyMaterial = async (password: string) => {
  const crypto = getCrypto();
  return crypto.importKey('raw', textEncoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey', 'deriveBits']);
};

const deriveAesKey = async (password: string, salt: string) => {
  const crypto = getCrypto();
  const keyMaterial = await deriveKeyMaterial(password);
  return crypto.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

const getRandomBytes = (length: number) => {
  const array = new Uint8Array(length);
  (typeof window !== 'undefined' && window.crypto?.getRandomValues
    ? window.crypto.getRandomValues
    : globalThis.crypto.getRandomValues)(array);
  return array;
};

export const generateSalt = (bytes = 16) => bytesToBase64(getRandomBytes(bytes));

export const hashPassword = async (password: string, salt: string) => {
  const crypto = getCrypto();
  const keyMaterial = await deriveKeyMaterial(password);
  const derivedBits = await crypto.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToBase64(derivedBits);
};

export const verifyPassword = async (password: string, salt: string, hash: string) => {
  const computed = await hashPassword(password, salt);
  return computed === hash;
};

export const deriveEncryptionKey = async (password: string, salt: string) => {
  const key = await deriveAesKey(password, salt);
  const crypto = getCrypto();
  const raw = await crypto.exportKey('raw', key);
  return bytesToBase64(raw);
};

const importEncryptionKey = async (keyBase64: string) => {
  const crypto = getCrypto();
  return crypto.importKey('raw', base64ToBytes(keyBase64), 'AES-GCM', false, ['encrypt', 'decrypt']);
};

export const encryptPayload = async (payload: string, keyBase64: string) => {
  const crypto = getCrypto();
  const key = await importEncryptionKey(keyBase64);
  const iv = getRandomBytes(12);
  const cipherBuffer = await crypto.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(payload));
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuffer), iv.length);
  return bytesToBase64(combined.buffer);
};

export const decryptPayload = async (encryptedBase64: string, keyBase64: string) => {
  const crypto = getCrypto();
  const key = await importEncryptionKey(keyBase64);
  const data = base64ToBytes(encryptedBase64);
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plainBuffer = await crypto.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuffer);
};

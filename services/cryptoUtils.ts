const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

const base64ToBuffer = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const deriveKeyMaterial = async (password: string) =>
  crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

const deriveKey = async (password: string, salt: string, usages: KeyUsage[]) => {
  const keyMaterial = await deriveKeyMaterial(password);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBuffer(salt),
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    usages,
  );
};

const deriveBits = async (password: string, salt: string) => {
  const keyMaterial = await deriveKeyMaterial(password);
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBuffer(salt),
      iterations: 150000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
};

export const generateSalt = () => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(saltBytes.buffer);
};

export const createPasswordRecord = async (password: string, salt = generateSalt()) => {
  const derived = await deriveBits(password, salt);
  return {
    hash: bufferToBase64(derived),
    salt,
  };
};

export const verifyPassword = async (
  password: string,
  stored: { hash: string | null; salt: string | null },
): Promise<boolean> => {
  if (!stored.hash || !stored.salt) return false;
  const derived = await createPasswordRecord(password, stored.salt);
  return derived.hash === stored.hash;
};

export const encryptPayload = async (
  plaintext: string,
  password: string,
  salt: string,
): Promise<{ ciphertext: string; iv: string }> => {
  const key = await deriveKey(password, salt, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
  };
};

export const decryptPayload = async (
  ciphertext: string,
  iv: string,
  password: string,
  salt: string,
): Promise<string> => {
  const key = await deriveKey(password, salt, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBuffer(iv) }, key, base64ToBuffer(ciphertext));
  return decoder.decode(decrypted);
};

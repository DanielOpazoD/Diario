const encoder = new TextEncoder();

export const generateSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const bytesToHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');

const deriveKey = async (pin: string, saltHex: string) => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  );
};

export const hashPin = async (pin: string, saltHex: string) => {
  const key = await deriveKey(pin, saltHex);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pin));
  return bytesToHex(signature);
};

export const verifyPin = async (pin: string, saltHex: string, expectedHash: string) => {
  const hash = await hashPin(pin, saltHex);
  return hash === expectedHash;
};

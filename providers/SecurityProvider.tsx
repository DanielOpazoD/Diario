import React, { createContext, useCallback, useMemo, useState } from 'react';

interface SecurityContextValue {
  hasMasterKey: boolean;
  activeEmail: string | null;
  setMasterPassword: (password: string, email: string) => Promise<void>;
  clearSession: () => void;
  encryptBackupPayload: (payload: unknown) => Promise<string>;
  decryptBackupPayload: <T = unknown>(payload: unknown) => Promise<T>;
  requestMasterPassword: () => void;
  isPromptOpen: boolean;
  closePrompt: () => void;
}

interface EncryptedPayload {
  version: 'medidiario-encrypted-v1';
  iv: string;
  salt: string;
  cipher: string;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBuffer = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const combineSalt = (email: string, salt: Uint8Array) => {
  const emailSalt = encoder.encode(`medidiario|${email.toLowerCase()}`);
  const combined = new Uint8Array(emailSalt.length + salt.length);
  combined.set(emailSalt);
  combined.set(salt, emailSalt.length);
  return combined;
};

const isEncryptedPayload = (value: any): value is EncryptedPayload =>
  Boolean(value && value.version === 'medidiario-encrypted-v1' && value.iv && value.salt && value.cipher);

export const SecurityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [keyMaterial, setKeyMaterial] = useState<CryptoKey | null>(null);
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const setMasterPassword = useCallback(async (password: string, email: string) => {
    const importedKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    setKeyMaterial(importedKey);
    setActiveEmail(email.toLowerCase());
    setIsPromptOpen(false);
  }, []);

  const clearSession = useCallback(() => {
    setKeyMaterial(null);
    setActiveEmail(null);
  }, []);

  const deriveAesKey = useCallback(
    async (salt: Uint8Array) => {
      if (!keyMaterial || !activeEmail) {
        throw new Error('No hay una clave maestra activa en esta pestaña.');
      }

      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: combineSalt(activeEmail, salt),
          iterations: 310_000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    },
    [keyMaterial, activeEmail]
  );

  const encryptBackupPayload = useCallback(
    async (payload: unknown) => {
      if (!activeEmail) {
        throw new Error('No hay sesión de usuario para vincular la clave maestra.');
      }

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const aesKey = await deriveAesKey(salt);
      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoder.encode(JSON.stringify(payload))
      );

      const encryptedPayload: EncryptedPayload = {
        version: 'medidiario-encrypted-v1',
        iv: bufferToBase64(iv),
        salt: bufferToBase64(salt),
        cipher: bufferToBase64(new Uint8Array(cipherBuffer)),
      };

      return JSON.stringify(encryptedPayload, null, 2);
    },
    [activeEmail, deriveAesKey]
  );

  const decryptBackupPayload = useCallback(
    async <T,>(payload: unknown): Promise<T> => {
      if (!isEncryptedPayload(payload)) {
        return payload as T;
      }

      const aesKey = await deriveAesKey(base64ToBuffer(payload.salt));
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBuffer(payload.iv) },
        aesKey,
        base64ToBuffer(payload.cipher)
      );

      return JSON.parse(decoder.decode(plainBuffer)) as T;
    },
    [deriveAesKey]
  );

  const requestMasterPassword = useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      hasMasterKey: Boolean(keyMaterial && activeEmail),
      activeEmail,
      setMasterPassword,
      clearSession,
      encryptBackupPayload,
      decryptBackupPayload,
      requestMasterPassword,
      isPromptOpen,
      closePrompt: () => setIsPromptOpen(false),
    }),
    [activeEmail, decryptBackupPayload, encryptBackupPayload, isPromptOpen, keyMaterial, setMasterPassword, clearSession]
  );

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

export default SecurityContext;

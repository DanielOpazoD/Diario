export const safeSessionGetItem = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSessionSetItem = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export const safeSessionRemoveItem = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};

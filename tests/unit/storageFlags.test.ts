import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDebugModeFlag, getStoredAppVersion, setStoredAppVersion } from '@shared/utils/storageFlags';
import { STORAGE_KEYS } from '@shared/constants/storageKeys';

describe('storageFlags', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('reads and writes app version', () => {
    setStoredAppVersion('1.2.3');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEYS.APP_VERSION, '1.2.3');
    localStorageMock.getItem.mockReturnValueOnce('1.2.3');
    expect(getStoredAppVersion()).toBe('1.2.3');
  });

  it('reads debug flag', () => {
    localStorageMock.getItem.mockReturnValueOnce('true');
    expect(getDebugModeFlag()).toBe(true);
    localStorageMock.getItem.mockReturnValueOnce('false');
    expect(getDebugModeFlag()).toBe(false);
  });

  it('returns null/undefined when storage access throws', () => {
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('read failed');
    });
    expect(getStoredAppVersion()).toBeNull();

    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('write failed');
    });
    expect(setStoredAppVersion('2.0.0')).toBeUndefined();
  });

  it('handles missing window in non-browser environments', () => {
    const originalWindow = globalThis.window;
    const originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(getStoredAppVersion()).toBeNull();
    expect(getDebugModeFlag()).toBe(false);
    expect(setStoredAppVersion('1.0.0')).toBeUndefined();

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  });
});

import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import useAutoLock from '../useAutoLock';

describe('useAutoLock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bloquea por defecto cuando existe PIN y se desbloquea al llamar unlock', () => {
    const { result } = renderHook((props) => useAutoLock(props), {
      initialProps: { securityPin: '1234', autoLockMinutes: 5 }
    });

    expect(result.current.isLocked).toBe(true);

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
  });

  it('activa el autolock tras inactividad', () => {
    const { result } = renderHook((props) => useAutoLock(props), {
      initialProps: { securityPin: '1234', autoLockMinutes: 0.001 }
    });

    act(() => {
      result.current.unlock();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isLocked).toBe(true);
  });

  it('desbloquea cuando se elimina el PIN', () => {
    const { result, rerender } = renderHook((props) => useAutoLock(props), {
      initialProps: { securityPin: '1234', autoLockMinutes: 5 }
    });

    expect(result.current.isLocked).toBe(true);

    rerender({ securityPin: null, autoLockMinutes: 5 });

    expect(result.current.isLocked).toBe(false);
  });
});

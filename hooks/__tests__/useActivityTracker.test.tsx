import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import useActivityTracker from '../useActivityTracker';

describe('useActivityTracker', () => {
  it('ejecuta el callback de actividad cuando no está bloqueado', () => {
    const onActivity = vi.fn();
    renderHook(() => useActivityTracker(false, onActivity));

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'));
      window.dispatchEvent(new KeyboardEvent('keydown'));
    });

    expect(onActivity).toHaveBeenCalledTimes(2);
  });

  it('no llama al callback cuando está bloqueado', () => {
    const onActivity = vi.fn();
    renderHook(() => useActivityTracker(true, onActivity));

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'));
      window.dispatchEvent(new MouseEvent('mousedown'));
    });

    expect(onActivity).not.toHaveBeenCalled();
  });
});

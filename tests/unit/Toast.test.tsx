import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Toast from '@core/ui/Toast';
import useAppStore from '@core/stores/useAppStore';

describe('Toast', () => {
  it('renders toast messages and allows dismissal', () => {
    act(() => {
      useAppStore.setState({
        toasts: [{ id: 't1', type: 'success', message: 'Guardado' }],
      } as any);
    });

    render(<Toast />);
    expect(screen.getByText('Guardado')).toBeTruthy();

    const button = screen.getByRole('button');
    act(() => {
      fireEvent.click(button);
    });

    expect(useAppStore.getState().toasts).toHaveLength(0);
  });

  it('auto-removes toast after timeout', () => {
    vi.useFakeTimers();
    act(() => {
      useAppStore.setState({
        toasts: [{ id: 't2', type: 'info', message: 'Info' }],
      } as any);
    });

    render(<Toast />);
    expect(screen.getByText('Info')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(useAppStore.getState().toasts).toHaveLength(0);
    vi.useRealTimers();
  });
});

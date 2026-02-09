import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmationModal from '@core/ui/ConfirmationModal';

describe('ConfirmationModal', () => {
  it('renders when open and triggers confirm + close', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmationModal
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirmar"
        message="Seguro?"
        confirmText="OK"
        cancelText="No"
      />
    );

    expect(screen.getByText('Confirmar')).toBeTruthy();
    expect(screen.getByText('Seguro?')).toBeTruthy();

    fireEvent.click(screen.getByText('OK'));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ConfirmationModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Hidden"
        message="Hidden"
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

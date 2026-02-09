import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import PasteImageConfirmModal from '@features/files/PasteImageConfirmModal';

const blob = new Blob(['test'], { type: 'image/png' });

describe('PasteImageConfirmModal', () => {
  const createObjectURL = vi.fn(() => 'blob:preview');
  const revokeObjectURL = vi.fn();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    Object.defineProperty(global.URL, 'createObjectURL', { value: createObjectURL, writable: true });
    Object.defineProperty(global.URL, 'revokeObjectURL', { value: revokeObjectURL, writable: true });
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns null when closed', () => {
    const { container } = render(
      <PasteImageConfirmModal
        imageBlob={blob}
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders and confirms metadata', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <PasteImageConfirmModal
        imageBlob={blob}
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Ej: Radiografía, Evolución Médica...'), { target: { value: 'Radiografía' } });
    fireEvent.change(screen.getByPlaceholderText('Escribe una nota para este archivo...'), { target: { value: 'Observación' } });

    fireEvent.click(screen.getByText('GUARDAR IMAGEN'));

    expect(onConfirm).toHaveBeenCalledWith({
      title: 'Radiografía',
      note: 'Observación',
      date: '2025-01-15',
    });
  });
});

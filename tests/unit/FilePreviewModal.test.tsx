import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilePreviewModal from '@features/files/FilePreviewModal';
import { AttachedFile } from '@shared/types';

describe('FilePreviewModal', () => {
  const baseFile: AttachedFile = {
    id: 'file-1',
    name: 'reporte.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    uploadedAt: 1700000000000,
    driveUrl: 'https://example.com/reporte.pdf',
    isStarred: false,
  };

  it('returns null when closed or file missing', () => {
    const { container } = render(
      <FilePreviewModal file={null} isOpen onClose={vi.fn()} onUpdate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('toggles star and saves edits', () => {
    const onUpdate = vi.fn();

    render(
      <FilePreviewModal
        file={{ ...baseFile, customTitle: 'Reporte' }}
        isOpen
        onClose={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ isStarred: true }));

    fireEvent.click(screen.getByTitle('Editar metadata'));

    fireEvent.change(screen.getByPlaceholderText('reporte.pdf'), { target: { value: 'Nuevo título' } });
    const descriptionField = screen.getByText('Descripción').parentElement?.querySelector('textarea');
    const tagsField = screen.getByText('Tags (separados por coma)').parentElement?.querySelector('input');
    const categoryField = screen.getByText('Categoría').parentElement?.querySelector('select');
    const customTypeField = screen.getByPlaceholderText('ej: Ecografía, Interconsulta');

    if (!descriptionField || !tagsField || !categoryField) {
      throw new Error('Metadata fields not found');
    }

    fireEvent.change(descriptionField, { target: { value: 'Detalle' } });
    fireEvent.change(tagsField, { target: { value: 'a, b' } });
    fireEvent.change(categoryField, { target: { value: 'lab' } });
    fireEvent.change(customTypeField, { target: { value: 'Etiqueta' } });

    fireEvent.click(screen.getByText('Guardar cambios'));

    const lastCall = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0] as AttachedFile;
    expect(lastCall.customTitle).toBe('Nuevo título');
    expect(lastCall.description).toBe('Detalle');
    expect(lastCall.tags).toEqual(['a', 'b']);
    expect(lastCall.category).toBe('lab');
    expect(lastCall.customTypeLabel).toBe('Etiqueta');
  });

  it('opens non-previewable file in new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <FilePreviewModal
        file={{ ...baseFile, mimeType: 'text/plain' }}
        isOpen
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Abrir en nueva pestaña'));
    expect(openSpy).toHaveBeenCalledWith(baseFile.driveUrl, '_blank');

    openSpy.mockRestore();
  });

  it('shows open-in-report action for json files', () => {
    const onOpenInReports = vi.fn();

    render(
      <FilePreviewModal
        file={{ ...baseFile, name: 'informe.json', mimeType: 'application/json' }}
        isOpen
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onOpenInReports={onOpenInReports}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir informe' }));
    expect(onOpenInReports).toHaveBeenCalledWith(expect.objectContaining({ name: 'informe.json' }));
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FilePreviewPane from '@features/files/FilePreviewPane';
import { AttachedFile } from '@shared/types';

describe('FilePreviewPane', () => {
  const baseFile: AttachedFile = {
    id: 'file-1',
    name: 'foto.png',
    mimeType: 'image/png',
    size: 1024,
    uploadedAt: 1700000000000,
    driveUrl: 'https://example.com/foto.png',
  };

  it('renders placeholder when no file selected', () => {
    render(<FilePreviewPane selectedFile={null} onOpenDetail={vi.fn()} />);
    expect(screen.getByText('Selecciona un archivo para previsualizar')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Abrir detalle' });
    expect(button).toBeDisabled();
  });

  it('renders image preview and metadata', () => {
    render(
      <FilePreviewPane
        selectedFile={{ ...baseFile, customTypeLabel: 'Imagen', noteDate: '2025-01-10', description: 'Nota' }}
        onOpenDetail={vi.fn()}
      />
    );

    expect(screen.getByAltText('foto.png')).toBeInTheDocument();
    expect(screen.getByText('Imagen')).toBeInTheDocument();
    expect(screen.getByText('FECHA DE NOTA: 2025-01-10')).toBeInTheDocument();
    expect(screen.getByText('Nota')).toBeInTheDocument();
  });

  it('opens non-previewable files in new tab', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <FilePreviewPane
        selectedFile={{ ...baseFile, mimeType: 'text/plain' }}
        onOpenDetail={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Ver archivo'));
    expect(openSpy).toHaveBeenCalledWith(baseFile.driveUrl, '_blank');

    openSpy.mockRestore();
  });
});

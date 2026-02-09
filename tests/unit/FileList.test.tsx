import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileList from '@features/files/FileList';
import { AttachedFile } from '@shared/types';

describe('FileList', () => {
  const baseFile: AttachedFile = {
    id: 'file-1',
    name: 'informe-medico.pdf',
    mimeType: 'application/pdf',
    size: 2048,
    uploadedAt: 1700000000000,
    driveUrl: 'https://example.com/file.pdf',
    thumbnailLink: undefined,
    isStarred: false,
    customTitle: 'Informe Médico',
    customTypeLabel: 'Epicrisis',
    noteDate: '2025-01-10',
    description: 'Detalle clínico',
  };

  it('renders file metadata and labels', () => {
    render(
      <FileList
        files={[baseFile]}
        onSelectFile={vi.fn()}
        onDeleteFile={vi.fn()}
        onToggleStar={vi.fn()}
      />
    );

    expect(screen.getByText('Informe Médico')).toBeInTheDocument();
    expect(screen.getByText('Epicrisis')).toBeInTheDocument();
    expect(screen.getByText('2025-01-10')).toBeInTheDocument();
    expect(screen.getByText('Detalle clínico')).toBeInTheDocument();
  });

  it('handles selection, star, open, and delete actions', () => {
    const onSelectFile = vi.fn();
    const onDeleteFile = vi.fn();
    const onToggleStar = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <FileList
        files={[baseFile]}
        onSelectFile={onSelectFile}
        onDeleteFile={onDeleteFile}
        onToggleStar={onToggleStar}
      />
    );

    fireEvent.click(screen.getByText('Informe Médico'));
    expect(onSelectFile).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Destacar'));
    expect(onToggleStar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Ver archivo'));
    expect(openSpy).toHaveBeenCalledWith(baseFile.driveUrl, '_blank');

    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(onDeleteFile).toHaveBeenCalledWith(baseFile.id);

    openSpy.mockRestore();
  });
});

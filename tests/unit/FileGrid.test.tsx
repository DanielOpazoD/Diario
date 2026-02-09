import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileGrid from '@features/files/FileGrid';
import { AttachedFile } from '@shared/types';

describe('FileGrid', () => {
  const file: AttachedFile = {
    id: 'file-1',
    name: 'imagen.png',
    mimeType: 'image/png',
    size: 4096,
    uploadedAt: 1700000000000,
    driveUrl: 'https://example.com/image.png',
    thumbnailLink: 'https://example.com/thumb.png',
    isStarred: true,
  };

  it('renders grid items and handles selection', () => {
    const onSelectFile = vi.fn();
    render(<FileGrid files={[file]} onSelectFile={onSelectFile} />);

    const name = screen.getByText('imagen.png');
    expect(name).toBeInTheDocument();

    fireEvent.click(name);
    expect(onSelectFile).toHaveBeenCalledWith(file);
  });
});

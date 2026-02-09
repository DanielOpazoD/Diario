import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StarredFilesSection from '@features/files/StarredFilesSection';
import { AttachedFile } from '@shared/types';

describe('StarredFilesSection', () => {
  const file: AttachedFile = {
    id: 'file-1',
    name: 'nota.pdf',
    mimeType: 'application/pdf',
    size: 1000,
    uploadedAt: 1700000000000,
    driveUrl: 'https://example.com/nota.pdf',
    isStarred: true,
  };

  it('returns null when empty', () => {
    const { container } = render(
      <StarredFilesSection starredFiles={[]} onSelectFile={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders starred files and handles selection', () => {
    const onSelectFile = vi.fn();
    render(<StarredFilesSection starredFiles={[file]} onSelectFile={onSelectFile} />);

    fireEvent.click(screen.getByText('nota.pdf'));
    expect(onSelectFile).toHaveBeenCalledWith(file);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileManagerHeader from '@features/files/FileManagerHeader';

describe('FileManagerHeader', () => {
  it('renders without AI button when no files', () => {
    render(
      <FileManagerHeader
        fileCount={0}
        hasFiles={false}
        viewMode="list"
        showStarredOnly={false}
        onOpenAIPanel={vi.fn()}
        onViewModeChange={vi.fn()}
        onToggleStarredOnly={vi.fn()}
      />
    );

    expect(screen.getByText('Archivos Adjuntos (0)')).toBeInTheDocument();
    expect(screen.queryByText('Asistente IA')).toBeNull();
  });

  it('handles actions and view mode changes', () => {
    const onOpenAIPanel = vi.fn();
    const onViewModeChange = vi.fn();
    const onToggleStarredOnly = vi.fn();

    render(
      <FileManagerHeader
        fileCount={3}
        hasFiles
        viewMode="grid"
        showStarredOnly
        onOpenAIPanel={onOpenAIPanel}
        onViewModeChange={onViewModeChange}
        onToggleStarredOnly={onToggleStarredOnly}
      />
    );

    fireEvent.click(screen.getByText('Asistente IA'));
    expect(onOpenAIPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle('Vista de lista'));
    expect(onViewModeChange).toHaveBeenCalledWith('list');

    fireEvent.click(screen.getByTitle('Vista de cuadrícula'));
    expect(onViewModeChange).toHaveBeenCalledWith('grid');

    fireEvent.click(screen.getByText('Solo destacados'));
    expect(onToggleStarredOnly).toHaveBeenCalledTimes(1);
  });
});

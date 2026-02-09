import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileDropzone from '@features/files/FileDropzone';

describe('FileDropzone', () => {
  const baseProps = {
    isDragging: false,
    isUploading: false,
    uploadProgress: 0,
    onDragEnter: vi.fn(),
    onDragLeave: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onClickUpload: vi.fn(),
  };

  it('renders upload prompt when idle', () => {
    render(<FileDropzone {...baseProps} />);

    expect(screen.getByText('Subir archivos adjuntos')).toBeInTheDocument();
    expect(screen.getByText('Arrastra o haz clic (PDF, IMG, DOC)')).toBeInTheDocument();
  });

  it('renders compact drag state text', () => {
    render(<FileDropzone {...baseProps} isDragging compact />);
    expect(screen.getByText('Soltar aquí')).toBeInTheDocument();
  });

  it('renders upload progress when uploading', () => {
    render(
      <FileDropzone
        {...baseProps}
        isUploading
        uploadProgress={42}
      />
    );

    expect(screen.getByText('Subiendo archivos (42%)...')).toBeInTheDocument();
  });

  it('calls upload handler on click and keydown', () => {
    const onClickUpload = vi.fn();
    const { container } = render(
      <FileDropzone
        {...baseProps}
        onClickUpload={onClickUpload}
      />
    );

    const dropzone = container.querySelector('[role="button"]');
    expect(dropzone).not.toBeNull();

    fireEvent.click(dropzone as HTMLElement);
    fireEvent.keyDown(dropzone as HTMLElement, { key: 'Enter' });
    fireEvent.keyDown(dropzone as HTMLElement, { key: ' ' });

    expect(onClickUpload).toHaveBeenCalledTimes(3);
  });

  it('renders paste button and handles click without bubbling', () => {
    const onPasteClick = vi.fn();
    const onClickUpload = vi.fn();

    render(
      <FileDropzone
        {...baseProps}
        onPasteClick={onPasteClick}
        onClickUpload={onClickUpload}
      />
    );

    const pasteButton = screen.getByRole('button', { name: 'PEGAR IMAGEN' });
    fireEvent.click(pasteButton);

    expect(onPasteClick).toHaveBeenCalledTimes(1);
    expect(onClickUpload).not.toHaveBeenCalled();
  });

  it('forwards drag events', () => {
    const onDragEnter = vi.fn();
    const onDragLeave = vi.fn();
    const onDragOver = vi.fn();
    const onDrop = vi.fn();

    const { container } = render(
      <FileDropzone
        {...baseProps}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      />
    );

    const dropzone = container.querySelector('[role="button"]');
    expect(dropzone).not.toBeNull();

    fireEvent.dragEnter(dropzone as HTMLElement);
    fireEvent.dragLeave(dropzone as HTMLElement);
    fireEvent.dragOver(dropzone as HTMLElement);
    fireEvent.drop(dropzone as HTMLElement);

    expect(onDragEnter).toHaveBeenCalledTimes(1);
    expect(onDragLeave).toHaveBeenCalledTimes(1);
    expect(onDragOver).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});

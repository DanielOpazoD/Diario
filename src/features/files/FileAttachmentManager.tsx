import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Trash2, ExternalLink } from 'lucide-react';
import { AttachedFile } from '@shared/types';
import {
  useUploadPatientFileFirebase,
  useDeletePatientFileFirebase
} from '@features/files/hooks/usePatientFiles';
import { AIAttachmentAssistant } from '@features/ai';
import FilePreviewModal from './FilePreviewModal';
import PasteImageConfirmModal from './PasteImageConfirmModal';

// Import modular components
import {
  FileDropzone,
  FileGrid,
  FileList,
  FilePreviewPane,
  FileManagerHeader,
  StarredFilesSection,
  formatFileSize,
  displayFileName,
  getFileIcon,
  getFileColor,
} from './index';

interface FileAttachmentManagerProps {
  files: AttachedFile[];
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange?: (folderId: string) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  patientId: string;
  compact?: boolean;
}

const FileAttachmentManager: React.FC<FileAttachmentManagerProps> = ({
  files,
  patientRut,
  patientName,
  patientId,
  onFilesChange,
  addToast,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [pastedImage, setPastedImage] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadToFirebase } = useUploadPatientFileFirebase({
    patientRut,
    patientName,
    patientId,
  });

  // Global Paste Listener
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Solo actuar si estamos en la interfaz de archivos y no escribiendo en un input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            setPastedImage(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleConfirmPaste = async (metadata: { title: string; note: string; date: string }) => {
    if (!pastedImage) return;

    const file = new File([pastedImage], metadata.title || `Captura_${Date.now()}.png`, { type: pastedImage.type });
    setPastedImage(null);

    setIsUploading(true);
    try {
      const attachedFile = await uploadToFirebase(file);
      // Enriquecer el archivo con los metadatos personalizados
      const enrichedFile: AttachedFile = {
        ...attachedFile,
        customTitle: metadata.title,
        description: metadata.note,
        noteDate: metadata.date,
      };
      onFilesChange([...files, enrichedFile]);
      addToast('success', 'Imagen pegada subida correctamente.');
    } catch (error: any) {
      addToast('error', `Error al subir imagen pegada: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const { mutateAsync: deleteFromFirebase } = useDeletePatientFileFirebase({
    addToast,
  });

  // Drag handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = async (fileList: FileList) => {
    if (!patientId) {
      addToast('error', 'Identificador de paciente no válido.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = fileList.length;
    const newAttachments: AttachedFile[] = [];
    let successCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = fileList[i];

      if (file.size > 10 * 1024 * 1024) {
        addToast('error', `El archivo ${file.name} excede 10MB.`);
        continue;
      }

      try {
        const attachedFile = await uploadToFirebase(file);
        newAttachments.push(attachedFile);
        successCount++;
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (error: any) {
        console.error(error);
        addToast('error', `Error subiendo ${file.name}: ${error.message}`);
      }
    }

    if (newAttachments.length > 0) {
      onFilesChange([...files, ...newAttachments]);
      addToast('success', `${successCount} archivos subidos exitosamente.`);
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId);
    if (!fileToDelete) return;

    if (!window.confirm('¿Eliminar archivo permanentemente?')) return;

    try {
      await deleteFromFirebase({
        patientId: patientId,
        fileName: fileToDelete.name,
        fileId: fileToDelete.id
      });

      const updatedList = files.filter((f) => f.id !== fileId);
      onFilesChange(updatedList);
      addToast('info', 'Archivo eliminado');
    } catch (error) {
      addToast('error', 'Error eliminando archivo');
    }
  };

  const handleSelectFile = (file: AttachedFile) => {
    setSelectedFile(file);
  };

  const handleFileUpdate = (updatedFile: AttachedFile) => {
    const updatedList = files.map((f) => (f.id === updatedFile.id ? updatedFile : f));
    onFilesChange(updatedList);
    setSelectedFile(updatedFile);
  };

  const toggleStar = (file: AttachedFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleFileUpdate({ ...file, isStarred: !file.isStarred });
  };

  const filteredFiles = useMemo(
    () => files.filter((file) => !showStarredOnly || file.isStarred),
    [files, showStarredOnly],
  );

  const starredFiles = useMemo(() => files.filter((file) => file.isStarred), [files]);

  // Auto-select first file
  useEffect(() => {
    if (!selectedFile && filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [filteredFiles.length, selectedFile]);

  // Validate selectedFile still exists
  useEffect(() => {
    if (selectedFile && !files.find((file) => file.id === selectedFile.id)) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  // Hidden file input
  const fileInput = (
    <input
      type="file"
      ref={fileInputRef}
      className="hidden"
      multiple
      onChange={handleFileInputChange}
    />
  );

  // Compact mode render
  if (compact) {
    return (
      <div className="flex flex-col space-y-2 animate-fade-in">
        {fileInput}
        <FileDropzone
          isDragging={isDragging}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          compact={true}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClickUpload={() => fileInputRef.current?.click()}
        />

        {files.length === 0 && !isUploading && (
          <div className="text-center py-4 text-gray-400 text-xs">
            No hay archivos adjuntos.
          </div>
        )}

        {filteredFiles.length > 0 && (
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs group"
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center ${getFileColor(file.mimeType)}`}>
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{displayFileName(file.name)}</p>
                  <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Ver/Descargar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full mode render
  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      {fileInput}

      <FileManagerHeader
        fileCount={files.length}
        hasFiles={files.length > 0}
        viewMode={viewMode}
        showStarredOnly={showStarredOnly}
        onOpenAIPanel={() => setIsAIPanelOpen(true)}
        onViewModeChange={setViewMode}
        onToggleStarredOnly={() => setShowStarredOnly(prev => !prev)}
      />

      <div className="flex-1 grid lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 overflow-y-auto custom-scrollbar space-y-4">
          <FileDropzone
            isDragging={isDragging}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            compact={false}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClickUpload={() => fileInputRef.current?.click()}
          />

          <StarredFilesSection
            starredFiles={starredFiles}
            onSelectFile={handleSelectFile}
          />

          {files.length === 0 && !isUploading && (
            <div className="text-center py-8 text-gray-400 text-xs border rounded-xl border-gray-100 dark:border-gray-800 border-dashed">
              No hay archivos adjuntos.
            </div>
          )}

          {files.length > 0 && filteredFiles.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-xs border rounded-xl border-gray-100 dark:border-gray-800">
              No hay adjuntos que coincidan con los filtros seleccionados.
            </div>
          )}

          {filteredFiles.length > 0 && (
            viewMode === 'grid' ? (
              <FileGrid files={filteredFiles} onSelectFile={handleSelectFile} />
            ) : (
              <FileList
                files={filteredFiles}
                onSelectFile={handleSelectFile}
                onDeleteFile={handleDelete}
                onToggleStar={toggleStar}
              />
            )
          )}
        </div>

        <FilePreviewPane
          selectedFile={selectedFile}
          onOpenDetail={() => setIsPreviewOpen(true)}
        />
      </div>

      <AIAttachmentAssistant
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        files={files}
        patientName={patientName}
      />

      <FilePreviewModal
        file={selectedFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onUpdate={handleFileUpdate}
      />

      <PasteImageConfirmModal
        isOpen={!!pastedImage}
        imageBlob={pastedImage || new Blob()}
        onClose={() => setPastedImage(null)}
        onConfirm={handleConfirmPaste}
      />
    </div>
  );
};

export default FileAttachmentManager;


import React, { useState, useRef } from 'react';
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Loader,
  AlertCircle,
  Sparkles,
  Grid,
  List,
  Star,
  Microscope,
  Scan,
  Pill
} from 'lucide-react';
import { AttachedFile } from '../types';
import { uploadFileForPatient, deleteFileFromDrive } from '../services/googleService';
import AIAttachmentAssistant from './AIAttachmentAssistant';
import FilePreviewModal from './FilePreviewModal';

interface FileAttachmentManagerProps {
  files: AttachedFile[];
  patientRut: string;
  patientName: string;
  onFilesChange: (files: AttachedFile[]) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const FileAttachmentManager: React.FC<FileAttachmentManagerProps> = ({
  files,
  patientRut,
  patientName,
  onFilesChange,
  addToast
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const token = sessionStorage.getItem('google_access_token');
    if (!token) {
      addToast('error', 'Inicia sesión con Google para subir archivos.');
      return;
    }

    if (!patientRut || !patientName) {
      addToast('error', 'Completa el Nombre y RUT antes de subir archivos.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const totalFiles = fileList.length;
    const newAttachments: AttachedFile[] = [];
    let successCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = fileList[i];
      
      // Basic Validation
      if (file.size > 10 * 1024 * 1024) {
        addToast('error', `El archivo ${file.name} excede 10MB.`);
        continue;
      }

      try {
        const attachedFile = await uploadFileForPatient(file, patientRut, patientName, token);
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
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("¿Eliminar archivo de Drive?")) return;

    const token = sessionStorage.getItem('google_access_token');
    if (!token) return addToast('error', 'Sesión expirada');

    try {
      await deleteFileFromDrive(fileId, token);
      const updatedList = files.filter(f => f.id !== fileId);
      onFilesChange(updatedList);
      addToast('info', 'Archivo movido a la papelera de Drive');
    } catch (error) {
      addToast('error', 'Error eliminando archivo');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'lab':
        return <Microscope className="w-4 h-4" />;
      case 'imaging':
        return <Scan className="w-4 h-4" />;
      case 'report':
        return <FileText className="w-4 h-4" />;
      case 'prescription':
        return <Pill className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const openPreview = (file: AttachedFile) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const handleUpdateFile = (updated: AttachedFile) => {
    const updatedFiles = files.map(f => (f.id === updated.id ? updated : f));
    setSelectedFile(updated);
    onFilesChange(updatedFiles);
  };

  const sortedFiles = [...files].sort((a, b) => Number(!!b.isStarred) - Number(!!a.isStarred));

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* AI Assistant Trigger */}
      {files.length > 0 && (
        <div className="flex justify-end mb-2">
           <button
             onClick={() => setIsAIPanelOpen(true)}
             className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-full text-xs font-bold shadow-md transition-all transform hover:scale-105"
           >
              <Sparkles className="w-3.5 h-3.5" /> Asistente IA
           </button>
        </div>
      )}

      {/* Drop Zone */}
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer mb-4
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileInputChange} 
        />
        
        {isUploading ? (
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Subiendo archivos ({uploadProgress}%)...</p>
          </div>
        ) : (
          <div className="text-center pointer-events-none">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {isDragging ? 'Suelta los archivos aquí' : 'Subir archivos adjuntos'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Arrastra o haz clic (PDF, IMG, DOC)</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Archivos Adjuntos ({files.length})</h3>
          <p className="text-[11px] text-gray-500">Vista rápida, edición y metadatos enriquecidos.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-[100px]">
        {files.length === 0 && !isUploading && (
          <div className="text-center py-8 text-gray-400 text-xs border rounded-xl border-gray-100 dark:border-gray-800 border-dashed">
            No hay archivos adjuntos.
          </div>
        )}

        {viewMode === 'grid' && files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sortedFiles.map(file => (
              <div
                key={file.id}
                onClick={() => openPreview(file)}
                className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg"
              >
                {file.thumbnailLink ? (
                  <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    {getCategoryIcon(file.category)}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-bold truncate">{file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '')}</p>
                  <p className="text-white/70 text-[10px]">{formatSize(file.size)}</p>
                </div>

                {file.isStarred && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  </div>
                )}

                {file.category && (
                  <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                    {file.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && files.length > 0 && (
          <div className="space-y-2">
            {sortedFiles.map(file => (
              <div key={file.id} className="group flex items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-all">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mr-3">
                  {getFileIcon(file.mimeType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {file.isStarred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate" title={file.name}>
                      {file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '')}
                    </h4>
                    {file.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 uppercase font-semibold text-gray-600 dark:text-gray-300">
                        {file.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatSize(file.size)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    {file.description && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-[180px]" title={file.description}>
                          {file.description}
                        </span>
                      </>
                    )}
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {file.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openPreview(file)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Ver detalles"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
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

      <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
        <AlertCircle className="w-3 h-3" />
        <span>Los archivos se guardan en tu carpeta: <b>MediDiario/Pacientes/{patientRut || '...'}-{patientName?.split(' ')[0] || '...'}</b></span>
      </div>

      {/* AI Panel */}
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
        onUpdate={handleUpdateFile}
      />
    </div>
  );
};

export default FileAttachmentManager;

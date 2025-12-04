import React, { useState, useRef, useMemo, useEffect, useCallback, useId } from 'react';
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
  RefreshCw,
  FolderPlus,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { AttachedFile } from '../types';
import { createPatientDriveFolder, uploadFileForPatient, deleteFileFromDrive } from '../services/googleService';
import { usePatientFiles } from '../hooks/usePatientFiles';
import AIAttachmentAssistant from './AIAttachmentAssistant';
import FilePreviewModal from './FilePreviewModal';

interface FileAttachmentManagerProps {
  files: AttachedFile[];
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  onFilesChange: (files: AttachedFile[]) => void;
  onDriveFolderIdChange?: (folderId: string) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const FileAttachmentManager: React.FC<FileAttachmentManagerProps> = ({
  files,
  patientRut,
  patientName,
  patientDriveFolderId,
  onFilesChange,
  onDriveFolderIdChange,
  addToast,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [hasDriveFolder, setHasDriveFolder] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(patientDriveFolderId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneDescriptionId = useId();

  // React Query hook para caché inteligente de archivos
  const {
    files: cachedFiles,
    isLoading: isSyncing,
    isFetching,
    refetch,
    updateCache,
    isFromCache,
    hasCachedData,
  } = usePatientFiles({
    patientRut,
    patientName,
    patientDriveFolderId: driveFolderId,
    enabled: !!patientRut && !!patientName,
  });

  // Sincronizar caché de React Query con el estado del componente padre
  useEffect(() => {
    if (cachedFiles.length > 0 || hasCachedData) {
      // Merge: preservar metadata local (tags, estrellas) pero actualizar datos de Drive
      const localById = new Map(files.map((f) => [f.id, f]));
      const merged = cachedFiles.map((remote) => {
        const local = localById.get(remote.id);
        return local ? { ...remote, isStarred: local.isStarred, description: local.description, tags: local.tags } : remote;
      });

      // Solo actualizar si hay cambios reales
      const currentIds = new Set(files.map(f => f.id));
      const newIds = new Set(merged.map(f => f.id));
      const hasChanges = merged.length !== files.length ||
        [...newIds].some(id => !currentIds.has(id)) ||
        [...currentIds].some(id => !newIds.has(id));

      if (hasChanges) {
        onFilesChange(merged);
      }
    }
  }, [cachedFiles, hasCachedData]);

  useEffect(() => {
    if (hasCachedData || cachedFiles.length > 0 || files.length > 0) {
      setHasDriveFolder(true);
    }
  }, [hasCachedData, cachedFiles, files.length]);

  useEffect(() => {
    setDriveFolderId(patientDriveFolderId || null);
    if (patientDriveFolderId) {
      setHasDriveFolder(true);
    }
  }, [patientDriveFolderId]);

  // Timestamp de última sincronización
  const lastSyncedAt = hasCachedData ? Date.now() : null;

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

    let ensuredFolderId = driveFolderId;
    try {
      if (ensuredFolderId) {
        await createPatientDriveFolder(patientRut, patientName, token, ensuredFolderId);
      } else {
        const { id } = await createPatientDriveFolder(patientRut, patientName, token);
        ensuredFolderId = id;
        setDriveFolderId(id);
        onDriveFolderIdChange?.(id);
        setHasDriveFolder(true);
      }
    } catch (error: any) {
      addToast('error', error?.message || 'No se pudo preparar la carpeta del paciente.');
      return;
    }

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
        const attachedFile = await uploadFileForPatient(file, patientRut, patientName, token, ensuredFolderId);
        newAttachments.push(attachedFile);
        successCount++;
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      } catch (error: any) {
        console.error(error);
        addToast('error', `Error subiendo ${file.name}: ${error.message}`);
      }
    }

    if (newAttachments.length > 0) {
      // Actualizar caché de React Query y estado local
      updateCache((oldFiles = []) => [...oldFiles, ...newAttachments]);
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
    if (!window.confirm('¿Eliminar archivo de Drive?')) return;

    const token = sessionStorage.getItem('google_access_token');
    if (!token) return addToast('error', 'Sesión expirada');

    try {
      await deleteFileFromDrive(fileId, token);
      const updatedList = files.filter((f) => f.id !== fileId);
      // Actualizar caché de React Query y estado local
      updateCache((oldFiles = []) => oldFiles.filter((f) => f.id !== fileId));
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();

  // Función de sincronización manual usando React Query
  const syncFromDrive = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!patientRut || !patientName) {
        if (!silent) addToast('error', 'Completa el Nombre y RUT del paciente para sincronizar.');
        return;
      }

      const token = sessionStorage.getItem('google_access_token');
      if (!token) {
        if (!silent) addToast('error', 'Conecta tu cuenta de Google para leer la carpeta de Drive.');
        return;
      }

      try {
        await refetch();
        if (!silent) {
          if (isFromCache) {
            addToast('info', 'Datos cargados desde caché. Actualizando desde Drive...');
          } else {
            addToast('success', 'Archivos sincronizados desde Drive.');
          }
        }
      } catch (error: any) {
        if (!silent) {
          addToast('error', error?.message || 'No se pudo sincronizar con Drive.');
        }
      }
    },
    [patientRut, patientName, refetch, isFromCache, addToast]
  );

  const handleCreateFolder = async () => {
    if (!patientRut || !patientName) {
      addToast('error', 'Completa el Nombre y RUT del paciente para crear la carpeta.');
      return;
    }

    const token = sessionStorage.getItem('google_access_token');
    if (!token) {
      addToast('error', 'Conecta tu cuenta de Google para crear la carpeta.');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const { id, webViewLink } = await createPatientDriveFolder(patientRut, patientName, token, driveFolderId);
      setDriveFolderId(id);
      onDriveFolderIdChange?.(id);
      addToast('success', 'Carpeta del paciente lista en Drive.');
      setHasDriveFolder(true);
      refetch(); // Usar React Query para refetch
      window.open(webViewLink, '_blank');
    } catch (error: any) {
      addToast('error', error?.message || 'No se pudo crear la carpeta de Drive.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleSelectFile = (file: AttachedFile) => {
    setSelectedFile(file);
  };

  const handleFileUpdate = (updatedFile: AttachedFile) => {
    const updatedList = files.map((f) => (f.id === updatedFile.id ? updatedFile : f));
    // Actualizar también el caché de React Query
    updateCache((oldFiles = []) =>
      oldFiles.map((f) => (f.id === updatedFile.id ? updatedFile : f))
    );
    onFilesChange(updatedList);
    setSelectedFile(updatedFile);
  };

  const toggleStar = (file: AttachedFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleFileUpdate({ ...file, isStarred: !file.isStarred });
  };

  const displayName = (name: string) => name.replace(/^\d{4}-\d{2}-\d{2}_/, '');

  const filteredFiles = useMemo(
    () =>
      files.filter((file) => {
        const matchStarred = !showStarredOnly || file.isStarred;
        return matchStarred;
      }),
    [files, showStarredOnly],
  );

  const starredFiles = useMemo(() => files.filter((file) => file.isStarred), [files]);

  useEffect(() => {
    if (selectedFile && !files.find((file) => file.id === selectedFile.id)) {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);

  useEffect(() => {
    if (!selectedFile && filteredFiles.length > 0) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [filteredFiles, selectedFile]);

  const renderGrid = (items: AttachedFile[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {items.map((file) => (
        <div
          key={file.id}
          onClick={() => handleSelectFile(file)}
          className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 cursor-pointer transition-all hover:shadow-md"
        >
          {file.thumbnailLink ? (
            <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
              {getFileIcon(file.mimeType)}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <p className="text-white text-xs font-bold truncate">{displayName(file.name)}</p>
            <div className="flex items-center gap-2 text-white/70 text-[10px]">
              <span>{formatSize(file.size)}</span>
              <span>•</span>
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
          </div>

          {file.isStarred && (
            <div className="absolute top-2 right-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderList = (items: AttachedFile[]) => (
    <div className="space-y-1.5">
      {items.map((file) => (
        <div
          key={file.id}
          onClick={() => handleSelectFile(file)}
          className="group flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer"
        >
          <div className="relative">
            <div className="w-11 h-11 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600">
              {file.thumbnailLink ? (
                <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                getFileIcon(file.mimeType)
              )}
            </div>
            <button
              onClick={(e) => toggleStar(file, e)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow-sm text-gray-400 hover:text-yellow-500"
              title={file.isStarred ? 'Quitar destacado' : 'Destacar'}
            >
              <Star className={`w-4 h-4 ${file.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </button>
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={file.name}>
                {displayName(file.name)}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span>{formatSize(file.size)}</span>
              <span>•</span>
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
            {file.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{file.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => window.open(file.driveUrl, '_blank')}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Ver en Drive"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(file.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Archivos Adjuntos ({files.length})</h3>
            <p className="text-xs text-gray-500">Previsualiza y organiza rápidamente</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold shadow-soft ${
                hasDriveFolder
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              }`}
              title={hasDriveFolder ? 'La carpeta del paciente está lista en Drive' : 'Crea la carpeta en Drive para subir archivos'}
            >
              {hasDriveFolder ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{hasDriveFolder ? 'Carpeta creada' : 'Carpeta pendiente'}</span>
            </div>
            <button
              onClick={() => syncFromDrive()}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all shadow-sm ${
                isSyncing
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-400'
              }`}
            >
              {isSyncing ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isSyncing ? 'Sincronizando…' : 'Sincronizar Drive'}
            </button>
            <button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all shadow-sm ${
                isCreatingFolder
                  ? 'bg-green-50 border-green-200 text-green-600'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-green-400'
              }`}
            >
              {isCreatingFolder ? <Loader className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
              {isCreatingFolder ? 'Creando carpeta…' : 'Crear carpeta en Drive'}
            </button>
            {files.length > 0 && (
              <button
                onClick={() => setIsAIPanelOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-full text-xs font-bold shadow-md transition-all transform hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" /> Asistente IA
              </button>
            )}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                title="Vista de cuadrícula"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowStarredOnly((prev) => !prev)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] transition-colors ${
              showStarredOnly
                ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-100'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-yellow-400 text-yellow-500' : 'text-gray-400'}`} />
            Solo destacados
          </button>
          {isFromCache && !isFetching && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-[11px] text-green-700 dark:text-green-300">
              <Zap className="w-3 h-3" />
              Carga instantánea
            </span>
          )}
          {isFetching && !isSyncing && (
            <span className="flex items-center gap-1 text-[11px] text-blue-500 dark:text-blue-400">
              <Loader className="w-3 h-3 animate-spin" />
              Actualizando...
            </span>
          )}
          {lastSyncedAt && (
            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-3 h-3" />
              Actualizado a las {new Date(lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

      <div className="flex-1 grid lg:grid-cols-3 gap-4 min-h-0">
        <div className="lg:col-span-2 overflow-y-auto custom-scrollbar space-y-4">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-busy={isUploading}
            aria-describedby={dropzoneDescriptionId}
            className={`
              relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer mb-2
              ${
                isDragging
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
              <div className="text-center space-y-2">
                <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Subiendo archivos ({uploadProgress}%)...</p>
              </div>
            ) : (
              <div className="text-center pointer-events-none space-y-1" id={dropzoneDescriptionId}>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {isDragging ? 'Suelta los archivos aquí' : 'Subir archivos adjuntos'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Arrastra o haz clic (PDF, IMG, DOC)</p>
              </div>
            )}
          </div>

          {starredFiles.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-100 text-xs font-semibold uppercase">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" /> Destacados del paciente
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {starredFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleSelectFile(file)}
                    className="min-w-[140px] text-left bg-white/80 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-2 shadow-sm hover:shadow-md transition"
                  >
                    <p className="text-xs font-bold text-gray-800 dark:text-amber-50 truncate">{displayName(file.name)}</p>
                    <p className="text-[10px] text-gray-500 dark:text-amber-100/80 truncate">
                      {formatDate(file.uploadedAt)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {filteredFiles.length > 0 && (viewMode === 'grid' ? renderGrid(filteredFiles) : renderList(filteredFiles))}
        </div>

        <div className="hidden lg:flex flex-col gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold">Visor integrado</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Imágenes y PDFs</p>
            </div>
            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={!selectedFile}
              className="text-xs px-2 py-1 rounded-lg border text-blue-600 border-blue-200 dark:border-blue-800 dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Abrir detalle
            </button>
          </div>

          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
            {!selectedFile && <p className="text-xs text-gray-400">Selecciona un archivo para previsualizar</p>}

            {selectedFile && (
              <div className="w-full h-full flex items-center justify-center p-1">
                {selectedFile.mimeType.startsWith('image/') && (
                  <img
                    src={`https://drive.google.com/uc?export=view&id=${selectedFile.id}`}
                    alt={selectedFile.name}
                    className="max-w-full max-h-full object-contain rounded-md shadow"
                  />
                )}
                {selectedFile.mimeType === 'application/pdf' && (
                  <iframe
                    src={`https://drive.google.com/file/d/${selectedFile.id}/preview`}
                    className="w-full h-full border-0 rounded-md"
                    title={selectedFile.name}
                  />
                )}
                {!selectedFile.mimeType.startsWith('image/') && selectedFile.mimeType !== 'application/pdf' && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                    <p>Tipo no previsualizable. Usa "Abrir detalle" para más opciones.</p>
                    <button
                      onClick={() => window.open(selectedFile.driveUrl, '_blank')}
                      className="text-blue-600 dark:text-blue-300 underline"
                    >
                      Abrir en Drive
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      </div>

      <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
        <AlertCircle className="w-3 h-3" />
        <span>
          Los archivos se guardan en tu carpeta: <b>MediDiario/Pacientes/{patientRut || '...'}-{patientName?.split(' ')[0] || '...'}</b>
        </span>
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
    </div>
  );
};

export default FileAttachmentManager;

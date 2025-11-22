import React, { useCallback, useEffect, useState } from 'react';
import { Cloud, X, Folder, FileText, Loader, FolderPlus, ChevronRight, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import { getFolderMetadata, listFolders, DriveEntry, ensureAccessToken } from '../services/googleService';
import { DriveFolderPreference } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string, folder: DriveFolderPreference) => void;
  defaultFileName: string;
  isLoading: boolean;
  preferredFolder: DriveFolderPreference;
  onFolderChange: (folder: DriveFolderPreference) => void;
}

const ROOT_FOLDER: DriveFolderPreference = { id: 'root', name: 'Mi unidad' };

const buildBreadcrumbTrail = async (token: string, folder: DriveFolderPreference) => {
  if (!folder.id || folder.id === 'root') return [ROOT_FOLDER];

  const path: DriveFolderPreference[] = [];
  let currentId: string | null | undefined = folder.id;
  let guard = 0;

  while (currentId && guard < 10) {
    const meta = await getFolderMetadata(token, currentId);
    path.unshift({ id: meta.id, name: meta.name });
    const parentId = meta.parents?.[0];
    if (!parentId || parentId === 'root') {
      path.unshift(ROOT_FOLDER);
      break;
    }
    currentId = parentId;
    guard += 1;
  }

  if (path.length === 0) {
    return [ROOT_FOLDER];
  }

  return path;
};

const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultFileName,
  isLoading,
  preferredFolder,
  onFolderChange
}) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [folderInput, setFolderInput] = useState(preferredFolder.name || 'MediDiario Backups');
  const [currentFolder, setCurrentFolder] = useState<DriveFolderPreference>(preferredFolder.id ? preferredFolder : ROOT_FOLDER);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolderPreference>(preferredFolder);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveFolderPreference[]>([ROOT_FOLDER]);
  const [childFolders, setChildFolders] = useState<DriveEntry[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [error, setError] = useState('');

  const loadFolder = useCallback(async (target: DriveFolderPreference) => {
    const token = await ensureAccessToken();

    setIsLoadingFolders(true);
    setError('');

    try {
      const [folderList, trail] = await Promise.all([
        listFolders(token, target.id && target.id !== 'root' ? target.id : undefined),
        buildBreadcrumbTrail(token, target)
      ]);

      setChildFolders(folderList.files || []);
      setBreadcrumbs(trail);
      setCurrentFolder(target.id ? target : ROOT_FOLDER);
    } catch (e) {
      console.error('Failed to navigate folders', e);
      setError('No se pudieron cargar las carpetas de Drive.');
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const startingFolder = preferredFolder.id ? preferredFolder : ROOT_FOLDER;
      setFileName(defaultFileName);
      setFolderInput(preferredFolder.name || 'MediDiario Backups');
      setSelectedFolder(preferredFolder);
      loadFolder(startingFolder);
    }
  }, [isOpen, preferredFolder, defaultFileName, loadFolder]);

  useEffect(() => {
    // Update selection when the user types a new name manually
    if (folderInput.trim().length > 0 && folderInput !== selectedFolder.name) {
      setSelectedFolder({ id: null, name: folderInput.trim() });
    }
  }, [folderInput, selectedFolder.name]);

  if (!isOpen) return null;

  const normalizedSelection: DriveFolderPreference = {
    id: selectedFolder.name === folderInput.trim() ? selectedFolder.id : null,
    name: folderInput.trim() || selectedFolder.name || 'MediDiario Backups'
  };

  const handleConfirm = () => {
    onFolderChange(normalizedSelection);
    onConfirm(fileName, normalizedSelection);
  };

  const handleFolderClick = (folder: DriveEntry) => {
    const target = { id: folder.id, name: folder.name };
    setSelectedFolder(target);
    setFolderInput(folder.name);
    loadFolder(target);
  };

  const handleBreadcrumbClick = (crumb: DriveFolderPreference) => {
    setSelectedFolder(crumb);
    setFolderInput(crumb.name);
    loadFolder(crumb);
  };

  const setAsDefault = () => {
    onFolderChange(normalizedSelection);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Respaldo en Google Drive
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nombre del Archivo</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Carpeta de Destino</label>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Predeterminada: {preferredFolder.name}
                  </span>
                  <button
                    onClick={setAsDefault}
                    className="text-blue-600 dark:text-blue-300 hover:underline font-semibold"
                  >
                    Establecer
                  </button>
                </div>
              </div>

              <div className="relative">
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="Escribe para crear o selecciona abajo..."
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id || crumb.name}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
                    <button
                      onClick={() => handleBreadcrumbClick(crumb)}
                      className={`px-2 py-1 rounded-lg border transition-colors ${
                        currentFolder.id === crumb.id
                          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Folder suggestions */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                    <Folder className="w-3 h-3" /> Navega en Drive
                  </span>
                  {isLoadingFolders && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
                </div>

                {error && (
                  <div className="mb-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-2">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar">
                  {!isLoadingFolders && childFolders.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No hay subcarpetas aquí.</span>
                  )}

                  {childFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                        selectedFolder.id === folder.id
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 text-blue-700 dark:text-blue-300 shadow-sm'
                          : 'bg-white dark:bg-gray-800/70 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      {folder.name}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-blue-500/80 dark:text-blue-400/80 mt-3 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg">
                  <FolderPlus className="w-3 h-3" />
                  Tip: Si la carpeta "{folderInput || selectedFolder.name}" no existe, se creará automáticamente en "{currentFolder.name}".
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading || isLoadingFolders}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              isLoading={isLoading}
              className="px-6"
              disabled={!fileName.trim()}
            >
              Guardar en Drive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupModal;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Cloud, X, FileJson, Clock, Loader, Download, Search, Folder, ChevronRight, CheckCircle2 } from 'lucide-react';
import Button from './Button';
import { listFolderEntries, getFolderMetadata, DriveEntry } from '../services/googleService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DriveFolderPreference } from '../types';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fileId: string) => void;
  isLoadingProp?: boolean;
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

  return path.length > 0 ? path : [ROOT_FOLDER];
};

const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  isLoadingProp,
  preferredFolder,
  onFolderChange,
}) => {
  const [entries, setEntries] = useState<DriveEntry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<DriveFolderPreference>(preferredFolder.id ? preferredFolder : ROOT_FOLDER);
  const [breadcrumbs, setBreadcrumbs] = useState<DriveFolderPreference[]>([ROOT_FOLDER]);

  const token = useMemo(() => sessionStorage.getItem('google_access_token'), []);

  const loadFolder = useCallback(async (target: DriveFolderPreference) => {
    if (!token) {
      setError('No hay sesión de Google activa.');
      return;
    }

    setIsLoadingList(true);
    setError('');

    try {
      const [data, trail] = await Promise.all([
        listFolderEntries(token, target.id && target.id !== 'root' ? target.id : undefined),
        buildBreadcrumbTrail(token, target),
      ]);

      setEntries(data.files || []);
      setCurrentFolder(target.id ? target : ROOT_FOLDER);
      setBreadcrumbs(trail);
    } catch (e) {
      console.error(e);
      setError('Error al cargar archivos o carpetas de Drive.');
    } finally {
      setIsLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      const startingFolder = preferredFolder.id ? preferredFolder : ROOT_FOLDER;
      setSearchQuery('');
      loadFolder(startingFolder);
    }
  }, [isOpen, preferredFolder, loadFolder]);

  const folders = entries.filter((entry) => entry.mimeType === 'application/vnd.google-apps.folder');
  const files = entries.filter((entry) => entry.mimeType === 'application/json');

  const visibleFiles = useMemo(() => {
    if (!searchQuery) return files;
    const lower = searchQuery.toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(lower));
  }, [files, searchQuery]);

  if (!isOpen) return null;

  const normalizedFolder: DriveFolderPreference = currentFolder.id ? currentFolder : ROOT_FOLDER;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Restaurar desde Drive
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id || crumb.name}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 opacity-60" />}
                  <button
                    onClick={() => loadFolder(crumb)}
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
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Predeterminada: {preferredFolder.name}
              </span>
              <button
                onClick={() => onFolderChange(normalizedFolder)}
                className="text-blue-600 dark:text-blue-300 hover:underline font-semibold"
              >
                Establecer
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4 shrink-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar archivo de respaldo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-800 shrink-0">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px] space-y-3">
            {/* Folder grid */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                  <Folder className="w-3 h-3" /> Carpetas
                </span>
                {isLoadingList && <Loader className="w-4 h-4 animate-spin text-blue-500" />}
              </div>

              {folders.length === 0 ? (
                <p className="text-xs text-gray-500">No hay subcarpetas en esta ubicación.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => loadFolder({ id: folder.id, name: folder.name })}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <Folder className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Files list */}
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">Buscando respaldos...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 py-6">
                <FileJson className="w-10 h-10 opacity-30" />
                <p>No se encontraron archivos JSON en esta carpeta.</p>
              </div>
            ) : visibleFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-4">
                <p>No se encontraron archivos con ese nombre.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => onSelect(file.id)}
                    disabled={isLoadingProp}
                    className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all group text-left"
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform">
                       <FileJson className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {file.modifiedTime ? format(new Date(file.modifiedTime), "d MMM yyyy, HH:mm", { locale: es }) : 'Sin fecha'}
                      </div>
                    </div>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Download className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoadingProp && (
             <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
                <div className="flex flex-col items-center">
                   <Loader className="w-8 h-8 animate-spin text-blue-500 mb-2"/>
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Descargando y procesando...</span>
                </div>
             </div>
          )}

          <div className="mt-6 shrink-0 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
             <Button variant="ghost" onClick={onClose} disabled={isLoadingProp}>Cancelar</Button>
             <Button variant="secondary" onClick={() => onFolderChange(normalizedFolder)} disabled={isLoadingProp}>
               Usar esta carpeta por defecto
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrivePickerModal;

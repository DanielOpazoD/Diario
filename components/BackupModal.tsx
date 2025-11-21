
import React, { useState, useEffect } from 'react';
import { Cloud, X, Folder, FileText, Loader, FolderPlus } from 'lucide-react';
import Button from './Button';
import { listFolders } from '../services/googleService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (fileName: string, folderName: string) => void;
  defaultFileName: string;
  isLoading: boolean;
}

const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultFileName,
  isLoading
}) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [folderName, setFolderName] = useState('MediDiario Backups');
  const [suggestedFolders, setSuggestedFolders] = useState<{id: string, name: string}[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const token = sessionStorage.getItem('google_access_token');
      if (token) {
        setIsLoadingFolders(true);
        listFolders(token)
          .then(data => {
            if (data.files) {
               // Deduplicate folders by name for the UI suggestion list
               const unique = data.files.filter((v: any, i: number, a: any[]) => a.findIndex((v2: any) => (v2.name === v.name)) === i);
               setSuggestedFolders(unique);
            }
          })
          .catch(err => console.error("Failed to load folders", err))
          .finally(() => setIsLoadingFolders(false));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700">
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Carpeta de Destino</label>
              <div className="relative">
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  value={folderName} 
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Escribe para crear o selecciona abajo..."
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              {/* Folder Suggestions */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {isLoadingFolders ? 'Buscando carpetas...' : 'Selección Rápida (Tus carpetas)'}
                  </span>
                  {isLoadingFolders && <Loader className="w-3 h-3 animate-spin text-blue-500" />}
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar p-1">
                  {!isLoadingFolders && suggestedFolders.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No se encontraron carpetas recientes. Escribe un nombre arriba para crear una nueva.</span>
                  )}
                  
                  {suggestedFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setFolderName(folder.name)}
                      className={`text-xs px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        folderName === folder.name 
                          ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 text-blue-700 dark:text-blue-300 shadow-sm' 
                          : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Folder className="w-3 h-3" />
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-blue-500/80 dark:text-blue-400/80 mt-2 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg">
                <FolderPlus className="w-3 h-3" />
                Tip: Si la carpeta "{folderName}" no existe, se creará automáticamente.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={() => onConfirm(fileName, folderName)}
              isLoading={isLoading}
              className="px-6"
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

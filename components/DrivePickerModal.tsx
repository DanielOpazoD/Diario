
import React, { useState, useEffect } from 'react';
import { Cloud, X, FileJson, Clock, Loader, Download, Search } from 'lucide-react';
import Button from './Button';
import { listFiles } from '../services/googleService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fileId: string) => void;
  isLoadingProp?: boolean;
}

interface DriveFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

const DrivePickerModal: React.FC<DrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  isLoadingProp
}) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<DriveFile[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFiles();
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredFiles(files);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredFiles(files.filter(f => f.name.toLowerCase().includes(lower)));
    }
  }, [searchQuery, files]);

  const loadFiles = async () => {
    setIsLoadingList(true);
    setError('');
    const token = sessionStorage.getItem('google_access_token');
    
    if (!token) {
      setError('No hay sesión de Google activa.');
      setIsLoadingList(false);
      return;
    }

    try {
      const data = await listFiles(token);
      if (data.files) {
        setFiles(data.files);
        setFilteredFiles(data.files);
      } else {
        setFiles([]);
        setFilteredFiles([]);
      }
    } catch (e) {
      console.error(e);
      setError('Error al cargar archivos de Drive.');
    } finally {
      setIsLoadingList(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-500" />
              Restaurar desde Drive
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
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

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
                <Loader className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">Buscando respaldos...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <FileJson className="w-10 h-10 opacity-30" />
                <p>No se encontraron archivos JSON en tu Drive.</p>
              </div>
            ) : filteredFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-10">
                 <p>No se encontraron archivos con ese nombre.</p>
               </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
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
                        {format(new Date(file.createdTime), "d MMM yyyy, HH:mm", { locale: es })}
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

          <div className="mt-6 shrink-0 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
             <Button variant="ghost" onClick={onClose} disabled={isLoadingProp}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrivePickerModal;

import React, { useEffect, useState } from 'react';
import { Edit3, Star, X, Tag, ExternalLink, FileText, File } from 'lucide-react';
import { format } from 'date-fns';
import { AttachedFile } from '../types';

interface FilePreviewModalProps {
  file: AttachedFile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (file: AttachedFile) => void;
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [category, setCategory] = useState<AttachedFile['category']>('other');

  useEffect(() => {
    if (file && isOpen) {
      setDescription(file.description || '');
      setTags(file.tags || []);
      setCategory(file.category || 'other');
      setTagInput('');
      setIsEditing(false);
    }
  }, [file, isOpen]);

  if (!file || !isOpen) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isPDF = file.mimeType === 'application/pdf';

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = () => {
    onUpdate({ ...file, description, category, tags });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      <div className="absolute inset-4 md:inset-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdate({ ...file, isStarred: !file.isStarred })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Star className={`w-5 h-5 ${file.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{file.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                {format(file.uploadedAt, 'd MMM yyyy')}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 uppercase font-semibold">
                  {file.mimeType.split('/')[1] || 'file'}
                </span>
                <span className="text-[10px] text-gray-400">{formatSize(file.size)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Editar metadatos"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <a
              href={file.driveUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Abrir en Drive"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 dark:bg-black/20">
            {isImage && (
              <img
                src={file.driveUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            )}
            {isPDF && (
              <iframe
                src={`${file.driveUrl}#view=FitH`}
                className="w-full h-full border-0 rounded-lg"
                title={file.name}
              />
            )}
            {!isImage && !isPDF && (
              <div className="flex flex-col items-center text-gray-500 gap-2">
                <FileText className="w-10 h-10" />
                <span className="text-sm">Vista previa no disponible</span>
              </div>
            )}
          </div>

          <div className="w-full md:w-[360px] border-t md:border-l border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-500">Detalles</span>
              {file.category && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 uppercase font-semibold">
                  {file.category}
                </span>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <File className="w-4 h-4" />
                <span className="font-semibold">{file.name.replace(/^\d{4}-\d{2}-\d{2}_/, '')}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {description || 'Sin descripción aún.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-gray-500">Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
                rows={2}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-gray-500">Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as AttachedFile['category'])}
                className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
                disabled={!isEditing}
              >
                <option value="lab">Laboratorio</option>
                <option value="imaging">Imagenología</option>
                <option value="report">Informe</option>
                <option value="prescription">Receta</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-gray-500 flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-100">
                    {tag}
                    {isEditing && (
                      <button onClick={() => removeTag(tag)} className="hover:text-blue-800" aria-label={`Eliminar ${tag}`}>
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {tags.length === 0 && <span className="text-xs text-gray-400">Sin etiquetas</span>}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Añadir tag y presiona Enter"
                    className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow"
                  >
                    Agregar
                  </button>
                </div>
              )}
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold shadow-md"
              >
                Guardar Cambios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;

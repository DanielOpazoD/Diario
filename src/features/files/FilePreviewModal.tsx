import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Edit3, File, FileText, Image as ImageIcon, Star, X, Download } from 'lucide-react';
import { AttachedFile } from '@shared/types';

interface FilePreviewModalProps {
  file: AttachedFile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (file: AttachedFile) => void;
}

const categoryLabels: Record<NonNullable<AttachedFile['category']>, string> = {
  lab: 'Laboratorio',
  imaging: 'Imagenología',
  report: 'Informe',
  prescription: 'Receta',
  other: 'Otro',
};

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [category, setCategory] = useState<AttachedFile['category']>('other');
  const [customTypeLabel, setCustomTypeLabel] = useState('');

  useEffect(() => {
    if (file) {
      setTitle(file.customTitle || file.name);
      setDescription(file.description || '');
      setTagsInput((file.tags || []).join(', '));
      setCategory(file.category || 'other');
      setCustomTypeLabel(file.customTypeLabel || '');
      setIsEditing(false);
    }
  }, [file]);

  const isImage = useMemo(() => file?.mimeType.startsWith('image/'), [file]);
  const isPDF = useMemo(() => file?.mimeType === 'application/pdf', [file]);
  const isOfficeDoc = useMemo(
    () =>
      !!file?.mimeType.match(
        /(msword|officedocument\.wordprocessingml|powerpoint|officedocument\.presentationml|excel|spreadsheetml)/i,
      ),
    [file],
  );

  const previewUrl = useMemo(() => {
    if (!file) return '';
    // If it's already a full URL (Firebase or similar), use it directly
    if (file.driveUrl.startsWith('http')) return file.driveUrl;

    // Legacy Google Drive handling
    if (isImage) return `https://drive.google.com/uc?export=view&id=${file.id}`;
    if (isPDF || isOfficeDoc) return `https://drive.google.com/file/d/${file.id}/preview`;
    return file.driveUrl;
  }, [file, isImage, isOfficeDoc, isPDF]);

  if (!file || !isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="w-10 h-10 text-purple-500" />;
    if (isPDF) return <FileText className="w-10 h-10 text-red-500" />;
    return <File className="w-10 h-10 text-gray-400" />;
  };

  const handleSave = () => {
    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    onUpdate({
      ...file,
      customTitle: title.trim() || file.name,
      description,
      category,
      tags: parsedTags,
      customTypeLabel: customTypeLabel.trim() || undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>

      <div className="absolute inset-4 md:inset-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onUpdate({ ...file, isStarred: !file.isStarred })}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Star className={`w-5 h-5 ${file.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{file.customTitle || file.name}</h3>
              <p className="text-xs text-gray-500">
                {format(file.uploadedAt, 'd MMM yyyy')} · {formatSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={file.driveUrl}
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-blue-600"
              title="Descargar archivo"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Editar metadata"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 dark:bg-black/20">
          {isImage && (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              loading="lazy"
            />
          )}
          {(isPDF || isOfficeDoc) && (
            <iframe src={previewUrl} className="w-full h-full border-0 rounded-lg" />
          )}
          {!isImage && !isPDF && !isOfficeDoc && (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              {getFileIcon()}
              <p className="text-sm">Previsualización no disponible</p>
              <button
                onClick={() => window.open(file.driveUrl, '_blank')}
                className="text-blue-600 text-xs underline hover:text-blue-700"
              >
                Abrir en nueva pestaña
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
            <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
              Tipo: {file.mimeType}
            </span>
            {(file.customTypeLabel || file.category) && (
              <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
                Etiqueta: {file.customTypeLabel || categoryLabels[file.category || 'other']}
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700">
              Subido: {format(file.uploadedAt, 'd MMM, HH:mm')}
            </span>
          </div>

          {!isEditing && (file.description || (file.tags && file.tags.length > 0)) && (
            <div className="space-y-2">
              {file.description && <p className="text-sm text-gray-700 dark:text-gray-200">{file.description}</p>}
              {file.tags && file.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                  {file.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">Nombre visible</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-gray-900"
                    placeholder={file.name}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-gray-900"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Tags (separados por coma)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-gray-900"
                    placeholder="ej: control, laboratorio, urgente"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold mb-1 block">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AttachedFile['category'])}
                    className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-gray-900"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block">Etiqueta personalizada</label>
                  <input
                    value={customTypeLabel}
                    onChange={(e) => setCustomTypeLabel(e.target.value)}
                    className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-gray-900"
                    placeholder="ej: Ecografía, Interconsulta"
                  />
                </div>
                <button
                  onClick={handleSave}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;

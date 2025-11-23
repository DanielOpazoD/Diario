import React, { useEffect, useState } from 'react';
import { Bookmark, BookmarkCategory } from '../types';
import { BookmarkPlus, Star, X } from 'lucide-react';

interface BookmarkForm extends Omit<Bookmark, 'id' | 'createdAt' | 'order'> {}

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BookmarkForm, id?: string) => void;
  categories: BookmarkCategory[];
  initialData?: Bookmark;
}

const BookmarksModal: React.FC<BookmarksModalProps> = ({ isOpen, onClose, onSave, categories, initialData }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>('default');
  const [isFavorite, setIsFavorite] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setTitle(initialData.title || '');
      setUrl(initialData.url || '');
      setIcon(initialData.icon || '');
      setNote(initialData.note || '');
      setCategoryId(initialData.categoryId || 'default');
      setIsFavorite(Boolean(initialData.isFavorite));
    } else {
      setTitle('');
      setUrl('');
      setIcon('');
      setNote('');
      setCategoryId('default');
      setIsFavorite(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    onSave(
      {
        title,
        url,
        icon: icon || undefined,
        note: note || undefined,
        categoryId: categoryId || undefined,
        isFavorite
      },
      initialData?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200/60 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Editar marcador' : 'Nuevo marcador'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">URL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://intranet.hospital.cl"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Título (opcional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ficha clínica"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Déjalo vacío para mostrar solo el icono.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Emoji o icono</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🩺"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Puedes pegar un emoji o la URL de un ícono.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nota</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Portal de resultados de laboratorio"
              className="w-full min-h-[80px] px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Categoría</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-yellow-400/40' : 'text-gray-400'}`} />
                Mostrar en barra superior
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
            >
              {initialData ? 'Guardar cambios' : 'Agregar marcador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookmarksModal;

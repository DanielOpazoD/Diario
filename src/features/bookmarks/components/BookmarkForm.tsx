import React from 'react';
import { BookmarkPlus, Plus } from 'lucide-react';
import { BookmarkCategory } from '@shared/types';

export interface BookmarkFormState {
    title: string;
    url: string;
    icon: string;
    note: string;
    categoryId: string;
    isFavorite: boolean;
}

interface BookmarkFormProps {
    form: BookmarkFormState;
    editingId: string | null;
    bookmarkCategories: BookmarkCategory[];
    error: string | null;
    setForm: (form: (prev: BookmarkFormState) => BookmarkFormState) => void;
    onSubmit: (event: React.FormEvent) => void;
    onAddCategory: () => void;
}

const presetIcons = ['🩺', '💊', '📁', '🧠', '🧪', '📌', '🌐', '⚕️'];

const BookmarkForm: React.FC<BookmarkFormProps> = ({
    form,
    editingId,
    bookmarkCategories,
    error,
    setForm,
    onSubmit,
    onAddCategory,
}) => {
    return (
        <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">URL</label>
                <input
                    type="url"
                    value={form.url}
                    onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://portal-clinico.cl"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Título (opcional)</label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ficha Clínica"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Ícono (emoji o URL)</label>
                <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="🧪 o https://.../icon.png"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Se intentará usar el favicon del sitio primero. Si no existe, se mostrará el ícono que elijas.
                </p>
                <div className="flex flex-wrap gap-2">
                    {presetIcons.map((icon) => (
                        <button
                            type="button"
                            key={icon}
                            onClick={() => setForm((prev) => ({ ...prev, icon }))}
                            className={`px-2.5 py-1.5 rounded-lg border text-sm transition-colors ${form.icon === icon
                                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            aria-label={`Usar ícono ${icon}`}
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nota</label>
                <textarea
                    value={form.note}
                    onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Indicaciones o recordatorios"
                    rows={3}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-between">
                        Categoría
                        <button
                            type="button"
                            onClick={onAddCategory}
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Nueva
                        </button>
                    </label>
                    <select
                        value={form.categoryId}
                        onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {bookmarkCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Favorito</label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                            type="checkbox"
                            checked={form.isFavorite}
                            onChange={(e) => setForm((prev) => ({ ...prev, isFavorite: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Mostrar en la barra rápida
                    </label>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                {editingId ? 'Guardar cambios' : 'Agregar marcador'}
                {editingId ? <BookmarkPlus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
        </form>
    );
};

export default BookmarkForm;

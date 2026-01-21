import React, { useState } from 'react';
import { X, Save, Image as ImageIcon, Calendar, FileText, Type } from 'lucide-react';
import { format } from 'date-fns';

interface PasteImageConfirmModalProps {
    imageBlob: Blob;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (metadata: { title: string; note: string; date: string }) => void;
}

const PasteImageConfirmModal: React.FC<PasteImageConfirmModalProps> = ({
    imageBlob,
    isOpen,
    onClose,
    onConfirm
}) => {
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const imageUrl = React.useMemo(() => URL.createObjectURL(imageBlob), [imageBlob]);

    React.useEffect(() => {
        return () => URL.revokeObjectURL(imageUrl);
    }, [imageUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-gray-100 dark:border-gray-700">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Imagen Pegada</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Confirmar captura de pantalla</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Image Preview */}
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-sm" />
                    </div>

                    <div className="space-y-4">
                        {/* Title Input */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                                <Type className="w-3 h-3" /> Título del Archivo
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Radiografía, Evolución Médica..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:border-blue-500 outline-none transition-all font-semibold"
                                autoFocus
                            />
                        </div>

                        {/* Date Input */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Fecha de la Nota
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:border-blue-500 outline-none transition-all font-semibold"
                            />
                        </div>

                        {/* Note Input */}
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Nota / Observación
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Escribe una nota para este archivo..."
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900/50 text-sm focus:border-blue-500 outline-none transition-all font-medium resize-none shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm({ title, note, date })}
                        className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group tracking-tight"
                    >
                        <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        GUARDAR IMAGEN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasteImageConfirmModal;

import React, { useRef } from 'react';
import {
    Loader2,
    MessageSquare,
    Paperclip,
    RotateCw,
    Send,
    Sparkles,
    X,
} from 'lucide-react';

interface AIChatInputProps {
    inputValue: string;
    setInputValue: (value: string) => void;
    isLoading: boolean;
    attachments: File[];
    error: string | null;
    geminiStatus: string | null;
    isCheckingStatus: boolean;
    onFileChange: (files: FileList | null) => void;
    onRemoveAttachment: (index: number) => void;
    onSend: (prompt?: string) => void;
    onCheckStatus: () => void;
    quickPrompt: () => void;
    onExplain: () => void;
}

const AIChatInput: React.FC<AIChatInputProps> = ({
    inputValue,
    setInputValue,
    isLoading,
    attachments,
    error,
    geminiStatus,
    isCheckingStatus,
    onFileChange,
    onRemoveAttachment,
    onSend,
    onCheckStatus,
    quickPrompt,
    onExplain,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return (
        <div className="px-4 pb-3 space-y-3 bg-white/80 dark:bg-gray-900/80 border-t border-white/50 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2 justify-between">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                    <Paperclip className="h-4 w-4" />
                    Adjuntar archivos
                </button>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={quickPrompt}
                        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Resumir Exámenes
                    </button>
                    <button
                        onClick={onExplain}
                        className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md dark:bg-gray-700"
                    >
                        <Sparkles className="h-4 w-4" />
                        Explicar hallazgos
                    </button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => onFileChange(e.target.files)}
                />
            </div>

            {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {attachments.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center gap-2 rounded-lg border border-white/60 dark:border-gray-800 bg-white/60 dark:bg-gray-800/80 px-3 py-2 text-xs text-gray-700 dark:text-gray-200"
                        >
                            <Paperclip className="h-4 w-4 text-blue-500" />
                            <span className="truncate max-w-[140px]">{file.name}</span>
                            <button
                                onClick={() => onRemoveAttachment(index)}
                                className="text-gray-400 hover:text-red-500"
                                aria-label={`Eliminar ${file.name}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="flex-1 rounded-2xl border border-white/60 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur px-3 py-2 shadow-inner">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        rows={2}
                        placeholder="Escribe tu mensaje o usa 'Resumir Exámenes'"
                        className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                    />
                </div>
                <button
                    onClick={() => onSend()}
                    disabled={isLoading}
                    className="h-11 w-11 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl disabled:opacity-60"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400 items-center">
                <button
                    onClick={onCheckStatus}
                    disabled={isCheckingStatus}
                    className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-800/70 border border-white/60 dark:border-gray-700 px-2 py-1 text-[11px] text-gray-600 dark:text-gray-300 shadow-sm disabled:opacity-60"
                >
                    {isCheckingStatus ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <RotateCw className="h-3 w-3" />
                    )}
                    Verificar conexión
                </button>
                {geminiStatus && <span className="truncate">Gemini: {geminiStatus}</span>}
            </div>
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {error}
                </p>
            )}
        </div>
    );
};

export default AIChatInput;

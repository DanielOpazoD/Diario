import { useState, useRef, useEffect } from 'react';
import { askAboutImages, FileContent, validateEnvironment } from '@use-cases/ai';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
}

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                const [, data] = result.split(',');
                resolve(data || result);
            } else {
                reject(new Error('No se pudo leer el archivo.'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo.'));
        reader.readAsDataURL(file);
    });
};

export const useAIChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'ai',
            content: 'Hola, soy tu asistente de IA. Adjunta estudios médicos y pregúntame lo que necesites.',
        },
    ]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [geminiStatus, setGeminiStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileChange = (files: FileList | null) => {
        if (!files) return;

        const validFiles: File[] = [];
        Array.from(files).forEach((file) => {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                validFiles.push(file);
            }
        });

        if (validFiles.length === 0) {
            setError('Solo se aceptan imágenes y archivos PDF.');
            return;
        }

        setAttachments((prev) => [...prev, ...validFiles]);
        setError(null);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async (prompt?: string) => {
        const text = prompt ?? inputValue;
        if (!text.trim()) return;

        if (attachments.length === 0) {
            setError('Adjunta al menos un archivo (imagen o PDF) para continuar.');
            return;
        }

        setError(null);
        setIsLoading(true);
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
        setInputValue('');

        try {
            const imageParts: FileContent[] = await Promise.all(
                attachments.map(async (file) => {
                    const data = await readFileAsBase64(file);
                    return {
                        inlineData: {
                            mimeType: file.type || 'application/octet-stream',
                            data,
                        },
                    };
                })
            );

            const response = await askAboutImages(text, imageParts);
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', content: response }]);
        } catch (err: any) {
            const message = err?.message || 'Ocurrió un error al contactar con el asistente.';
            setError(message);
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', content: `Error: ${message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearConversation = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'ai',
                content: 'Hola, soy tu asistente de IA. Adjunta estudios médicos y pregúntame lo que necesites.',
            },
        ]);
        setAttachments([]);
        setInputValue('');
        setError(null);
    };

    const checkGeminiStatus = async () => {
        setIsCheckingStatus(true);
        try {
            const status = await validateEnvironment();
            setGeminiStatus(`${status.status} (preview: ${status.keyPreview || '-'})`);
        } catch (statusError: any) {
            setGeminiStatus(statusError?.message || 'No se pudo verificar el estado de Gemini.');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    return {
        messages,
        attachments,
        inputValue,
        setInputValue,
        isLoading,
        isCheckingStatus,
        geminiStatus,
        error,
        messagesEndRef,
        handleFileChange,
        handleRemoveAttachment,
        handleSend,
        handleClearConversation,
        checkGeminiStatus,
    };
};

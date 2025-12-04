import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { askAboutImages, FileContent } from '../services/geminiService';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface LocalAttachment {
  id: string;
  file: File;
  base64?: string;
}

const QUICK_SUMMARY_PROMPT = `Analiza los documentos adjuntos (exámenes médicos) y genera un resumen ESTRICTAMENTE con el siguiente formato minimalista.
Busca los valores más recientes. Si un valor no se encuentra, OMÍTELO. NO agregues introducciones ni conclusiones.

Formato requerido:
Fecha: [Fecha del examen si aparece]
*Hg* [valor]  *Plaquetas* [valor]  *RGB* [valor] *VHS* [valor]  *PCR* [valor + unidad]
*GOT* [valor] *GPT* [valor] *FA* [valor] *GGT* [valor] *BT* [valor] *BI* [valor]
*Hb glicosilada* [valor] *TSH* [valor] *T4L* [valor]
*Creat* [valor] *BUN* [valor] *HCO3* [valor] *K* [valor]  *Na* [valor]
*Col total* [valor]  *LDL* [valor]
*RAC* [valor]      *PSA* [valor]`;

const AIChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'Hola, soy tu asistente clínico. Adjunta imágenes o PDFs y cuéntame en qué puedo ayudarte.',
    },
  ]);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAttachments = attachments.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [, base64Data] = result.split(',');
        resolve(base64Data || '');
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setError(null);
    const newAttachments: LocalAttachment[] = [];

    for (const file of Array.from(files)) {
      const base64 = await convertFileToBase64(file);
      newAttachments.push({ id: crypto.randomUUID(), file, base64 });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    event.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const buildFilePayload = (): FileContent[] =>
    attachments
      .filter((item) => Boolean(item.base64))
      .map((item) => ({
        inlineData: {
          mimeType: item.file.type,
          data: item.base64 || '',
        },
      }));

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim()) return;
    if (!hasAttachments) {
      setError('Adjunta al menos una imagen o PDF para consultar.');
      return;
    }

    setError(null);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const imageParts = buildFilePayload();

    try {
      const aiResponse = await askAboutImages(prompt, imageParts);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', text: aiResponse }]);
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener respuesta.');
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'ai', text: 'Hubo un problema al procesar tu solicitud.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = () => {
    sendMessage(QUICK_SUMMARY_PROMPT);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  const attachmentBadge = useMemo(
    () =>
      hasAttachments ? (
        <span className="ml-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-300">
          {attachments.length}
        </span>
      ) : null,
    [attachments.length, hasAttachments]
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-4 pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[520px]">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30"
          >
            Asistente IA 🤖
            <ArrowUpRight className="h-4 w-4" />
          </button>
        )}

        {isOpen && (
          <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl backdrop-blur-md transition-all dark:border-gray-800/60 dark:bg-gray-900/90">
            <div className="flex items-center justify-between border-b border-white/40 px-4 py-3 dark:border-gray-800/60">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-inner">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Asistente IA</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Respuestas con Gemini</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 rounded-full border border-white/40 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Paperclip className="h-4 w-4" /> Adjuntar
                  {attachmentBadge}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] min-h-[55vh]">
              {hasAttachments && (
                <div className="flex gap-2 overflow-x-auto border-b border-white/40 px-4 py-3 dark:border-gray-800/60">
                  {attachments.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-w-[160px] flex-1 items-center gap-3 rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-xs shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        {item.file.type.includes('pdf') ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="truncate font-semibold text-gray-800 dark:text-gray-100">{item.file.name}</p>
                        <p className="text-[11px] uppercase text-gray-500 dark:text-gray-400">{item.file.type}</p>
                      </div>
                      <button
                        onClick={() => removeAttachment(item.id)}
                        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex h-[34vh] flex-col gap-3 overflow-y-auto px-4 py-3">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-white/80 text-gray-900 ring-1 ring-white/40 rounded-bl-none dark:bg-gray-800/90 dark:text-gray-100 dark:ring-gray-700'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-sm ring-1 ring-white/40 dark:bg-gray-800/90 dark:text-gray-100 dark:ring-gray-700">
                      <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && (
                <div className="px-4">
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-800/70 dark:bg-red-900/30 dark:text-red-200">
                    <X className="h-4 w-4" />
                    {error}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-white/40 px-4 py-3 dark:border-gray-800/60">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleQuickPrompt}
                    className="flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
                  >
                    <Sparkles className="h-4 w-4" /> Resumir Exámenes
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/40 bg-white/80 text-gray-600 shadow-sm transition hover:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <div className="flex-1 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Escribe un mensaje o usa un prompt rápido"
                      className="h-20 w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatDrawer;

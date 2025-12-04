import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Paperclip,
  RotateCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { askAboutImages, FileContent, validateEnvironment } from "../services/geminiService";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

const SUMMARY_PROMPT = `Analiza los documentos adjuntos (exámenes médicos) y genera un resumen ESTRICTAMENTE con el siguiente formato minimalista.
Busca los valores más recientes. Si un valor no se encuentra, omite la sección completa (no escribas el nombre del examen ni marcadores). NO agregues introducciones ni conclusiones.

Formato requerido (sin asteriscos):
Fecha: [Fecha del examen si aparece]
Hg [valor]  Plaquetas [valor]  RGB [valor] VHS [valor]  PCR [valor + unidad]
GOT [valor] GPT [valor] FA [valor] GGT [valor] BT [valor] BI [valor]
Hb glicosilada [valor] TSH [valor] T4L [valor]
Creat [valor] BUN [valor] HCO3 [valor] K [valor]  Na [valor]
Col total [valor]  LDL [valor]
RAC [valor]      PSA [valor]`;

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, data] = result.split(",");
        resolve(data || result);
      } else {
        reject(new Error("No se pudo leer el archivo."));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo."));
    reader.readAsDataURL(file);
  });
};

const AIChatDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hola, soy tu asistente de IA. Adjunta estudios médicos y pregúntame lo que necesites.",
    },
  ]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      setError("Solo se aceptan imágenes y archivos PDF.");
      return;
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    setError(null);
    event.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (prompt?: string) => {
    const text = prompt ?? inputValue;
    if (!text.trim()) return;

    if (attachments.length === 0) {
      setError("Adjunta al menos un archivo (imagen o PDF) para continuar.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInputValue("");

    try {
      const imageParts: FileContent[] = await Promise.all(
        attachments.map(async (file) => {
          const data = await readFileAsBase64(file);
          return {
            inlineData: {
              mimeType: file.type || "application/octet-stream",
              data,
            },
          };
        })
      );

      const response = await askAboutImages(text, imageParts);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", content: response }]);
    } catch (err: any) {
      const message = err?.message || "Ocurrió un error al contactar con el asistente.";
      setError(message);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", content: `Error: ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompt = () => handleSend(SUMMARY_PROMPT);

  const handleExplain = () =>
    handleSend(
      "Explica los hallazgos relevantes de los adjuntos y ofrece un plan de seguimiento resumido en máximo 4 viñetas."
    );

  const handleClearConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: "Hola, soy tu asistente de IA. Adjunta estudios médicos y pregúntame lo que necesites.",
      },
    ]);
    setAttachments([]);
    setInputValue("");
    setError(null);
  };

  const checkGeminiStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await validateEnvironment();
      setGeminiStatus(`${status.status} (preview: ${status.keyPreview || "-"})`);
    } catch (statusError: any) {
      setGeminiStatus(statusError?.message || "No se pudo verificar el estado de Gemini.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const drawerHeight = useMemo(() => (isExpanded ? "h-[70vh]" : "h-[55vh]"), [isExpanded]);

  return (
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg hover:shadow-xl transition"
          >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 ${drawerHeight} md:max-w-xl md:right-4 md:left-auto md:rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-white/60 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/50 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Asistente IA</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Gemini · Archivos + chat seguro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearConversation}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                aria-label="Alternar tamaño"
              >
                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white/80 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-white/60 dark:border-gray-700 rounded-bl-none"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-white/80 dark:bg-gray-800/80 px-4 py-3 text-gray-700 dark:text-gray-200 border border-white/60 dark:border-gray-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando con Gemini...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
                  onClick={handleExplain}
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
                onChange={handleFileChange}
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
                      onClick={() => handleRemoveAttachment(index)}
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
                onClick={() => handleSend()}
                disabled={isLoading}
                className="h-11 w-11 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400 items-center">
              <button
                onClick={checkGeminiStatus}
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
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><X className="h-3 w-3" />{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatDrawer;


import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, FileText, CheckCircle, Circle } from 'lucide-react';
import { AttachedFile } from '../types';
import { downloadFileAsBase64 } from '../services/googleService';
import { askAboutImages, FileContent } from '../services/geminiService';

interface AIAttachmentAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  files: AttachedFile[];
  patientName: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const EXAM_SUMMARY_PROMPT = `Analiza los documentos adjuntos (exámenes médicos) y genera un resumen ESTRICTAMENTE con el siguiente formato minimalista.
Busca los valores más recientes. NO agregues introducciones, conclusiones ni texto extra. Solo la lista de valores.

Instrucciones clave:
- La primera línea debe ser: [Nombre y Apellido si aparece] [RUT si aparece] [Fecha del examen más reciente si aparece]. Si falta un dato, deja el campo vacío, sin inventar.
- No informes exámenes que no se encuentren en los documentos. Omite la sección completa si falta un valor (ej. no mostrar TSH o T4L si no están reportados).
- Para Plaquetas y RGB/Leucocitos, si el valor está expresado en miles (x10^3/uL o similar), conviértelo a número absoluto multiplicando por 1.000 (ej: 4,83 x10^3/uL → 4.830; 300 x10^3/uL → 300.000). No redondees a la baja.
- Para "RGB" busca Leucocitos o Glóbulos Blancos. Para "PCR" incluye la unidad (ej. mg/dL). El resto SOLO el número.

Formato requerido (sin asteriscos):
[Nombre Apellido] [RUT] [Fecha]
Hg [valor]  Plaquetas [valor]  RGB [valor] VHS [valor]  PCR [valor + unidad]
GOT [valor] GPT [valor] FA [valor] GGT [valor] BT [valor] BI [valor]
Hb glicosilada [valor] TSH [valor] T4L [valor]
Creat [valor] BUN [valor] HCO3 [valor] K [valor]  Na [valor]
Col total [valor]  LDL [valor]
RAC [valor]      PSA [valor]`;

const AIAttachmentAssistant: React.FC<AIAttachmentAssistantProps> = ({ isOpen, onClose, files, patientName }) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'ai', text: `Hola. Soy tu asistente clínico. Selecciona los adjuntos de ${patientName} que quieras analizar y hazme una pregunta o usa una acción rápida.` }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
     if (selectedFiles.size === files.length) {
         setSelectedFiles(new Set());
     } else {
         setSelectedFiles(new Set(files.map(f => f.id)));
     }
  };

  const handleSendMessage = async (text?: string) => {
    const prompt = text || inputText;
    if (!prompt.trim()) return;
    if (selectedFiles.size === 0) {
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: 'Por favor, selecciona al menos un archivo adjunto para analizar.' }]);
        return;
    }

    // Add User Message
    const userMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: prompt }]);
    setInputText('');
    setIsLoading(true);

    try {
      // 1. Prepare files (Fetch content from Drive)
      const token = sessionStorage.getItem('google_access_token');
      if (!token) throw new Error("Sesión expirada. Recarga la página.");

      const filesToAnalyze = files.filter(f => selectedFiles.has(f.id));
      const imageParts: FileContent[] = [];

      // Show processing message
      setMessages(prev => [...prev, { id: 'processing', role: 'ai', text: `Procesando ${filesToAnalyze.length} archivos...` }]);

      for (const file of filesToAnalyze) {
        // Solo procesar imágenes y PDFs (si Gemini lo soporta, por ahora nos enfocamos en imagenes. 
        // Nota: Gemini soporta PDF, pero requiere enviarlo como application/pdf base64)
        if (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') {
            const base64 = await downloadFileAsBase64(file.id, token);
            imageParts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: base64
                }
            });
        }
      }

      if (imageParts.length === 0) {
         throw new Error("No se pudieron descargar los archivos o el formato no es compatible (Solo Imágenes/PDF).");
      }

      // 2. Send to Gemini
      const responseText = await askAboutImages(prompt, imageParts);

      // 3. Update Chat
      setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'processing');
          return [...filtered, { id: crypto.randomUUID(), role: 'ai', text: responseText }];
      });

    } catch (error: any) {
      setMessages(prev => {
          const filtered = prev.filter(m => m.id !== 'processing');
          return [...filtered, { id: crypto.randomUUID(), role: 'ai', text: `Error: ${error.message}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = () => {
     handleSendMessage(EXAM_SUMMARY_PROMPT);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Slide-over Panel */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white">
                 <Sparkles className="w-4 h-4" />
              </div>
              <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Asistente de Archivos</h3>
                  <p className="text-[10px] text-gray-500">Analizando adjuntos con Gemini 2.5</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
           </button>
        </div>

        {/* File Selection Area */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 max-h-40 overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase text-gray-500">Archivos Disponibles ({files.length})</span>
              <button onClick={selectAllFiles} className="text-xs text-blue-600 hover:underline">
                  {selectedFiles.size === files.length ? 'Deseleccionar' : 'Seleccionar Todos'}
              </button>
           </div>
           {files.length === 0 ? (
               <p className="text-xs text-gray-400 italic text-center py-2">No hay archivos adjuntos.</p>
           ) : (
               <div className="grid grid-cols-1 gap-2">
                  {files.map(file => (
                     <div key={file.id} onClick={() => toggleFileSelection(file.id)} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-300'}`}>
                        {selectedFiles.has(file.id) ? <CheckCircle className="w-4 h-4 text-blue-500 mr-2" /> : <Circle className="w-4 h-4 text-gray-300 mr-2" />}
                        <span className="text-xs truncate flex-1 text-gray-700 dark:text-gray-300">{file.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{file.mimeType.split('/')[1]}</span>
                     </div>
                  ))}
               </div>
           )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-black/20 space-y-4 custom-scrollbar">
           {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'}`}>
                   {msg.text}
                </div>
             </div>
           ))}
           {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Action & Input Area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
           {/* Quick Actions */}
           <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              <button 
                onClick={handleQuickAction}
                disabled={isLoading || selectedFiles.size === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                 <FileText className="w-3.5 h-3.5" /> Resumir Exámenes
              </button>
              <button 
                 onClick={() => handleSendMessage("¿Qué indicaciones o plan sugiere este documento?")}
                 disabled={isLoading || selectedFiles.size === 0}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                 <Sparkles className="w-3.5 h-3.5" /> Plan Sugerido
              </button>
           </div>

           {/* Input */}
           <div className="relative flex items-center">
              <input 
                type="text" 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunta sobre los archivos seleccionados..."
                disabled={isLoading}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
           </div>
           <p className="text-[10px] text-center text-gray-400 mt-2">
              La IA puede cometer errores. Verifica la información importante en los originales.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AIAttachmentAssistant;

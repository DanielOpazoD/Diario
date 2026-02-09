import React, { useCallback, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAIChat, AIChatHeader, AIChatMessageList, AIChatInput } from './index';

const SUMMARY_PROMPT = `Analiza los documentos adjuntos (exámenes médicos) y genera un resumen ESTRICTAMENTE con el siguiente formato minimalista.
Busca los valores más recientes. NO agregues introducciones ni conclusiones.

Instrucciones clave:
- La primera línea debe ser: [Nombre y Apellido si aparece] [RUT si aparece] [Fecha del examen más reciente si aparece]. Si falta un dato, deja el campo vacío, sin inventar.
- No informes exámenes que no se encuentren en los documentos. Omite la sección completa si falta un valor (ej. no mostrar TSH o T4L si no están reportados).
- Para Plaquetas y RGB/Leucocitos, si el valor está expresado en miles (x10^3/uL o similar), convierte a número absoluto multiplicando por 1.000 (ej: 4,83 x10^3/uL → 4.830; 300 x10^3/uL → 300.000). No redondees a la baja.
- Para PCR incluye unidad (ej. mg/dL). El resto, solo el número.

Formato requerido (sin asteriscos):
[Nombre Apellido] [RUT] [Fecha]
Hg [valor]  Plaquetas [valor]  RGB [valor] VHS [valor]  PCR [valor + unidad]
GOT [valor] GPT [valor] FA [valor] GGT [valor] BT [valor] BI [valor]
Hb glicosilada [valor] TSH [valor] T4L [valor]
Creat [valor] BUN [valor] HCO3 [valor] K [valor]  Na [valor]
Col total [valor]  LDL [valor]
RAC [valor]      PSA [valor]`;

interface AIChatDrawerProps {
  initialOpen?: boolean;
}

const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
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
  } = useAIChat();

  const quickPrompt = useCallback(() => handleSend(SUMMARY_PROMPT), [handleSend]);

  const handleExplain = useCallback(() => {
    handleSend(
      'Explica los hallazgos relevantes de los adjuntos y ofrece un plan de seguimiento resumido en máximo 4 viñetas.'
    );
  }, [handleSend]);

  const handleToggleOpen = useCallback(() => setIsOpen(true), []);
  const handleToggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsExpanded(false);
  }, []);

  const drawerHeight = useMemo(() => (isExpanded ? 'h-[70vh]' : 'h-[55vh]'), [isExpanded]);

  return (
    <div className="fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2">
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg hover:shadow-xl transition"
          aria-label="Abrir asistente IA"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 ${drawerHeight} md:max-w-xl md:right-4 md:left-auto md:rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-white/60 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up`}
        >
          <AIChatHeader
            isExpanded={isExpanded}
            onToggleExpand={handleToggleExpand}
            onClear={handleClearConversation}
            onClose={handleClose}
          />

          <AIChatMessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />

          <AIChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            attachments={attachments}
            error={error}
            geminiStatus={geminiStatus}
            isCheckingStatus={isCheckingStatus}
            onFileChange={handleFileChange}
            onRemoveAttachment={handleRemoveAttachment}
            onSend={handleSend}
            onCheckStatus={checkGeminiStatus}
            quickPrompt={quickPrompt}
            onExplain={handleExplain}
          />
        </div>
      )}
    </div>
  );
};

export default AIChatDrawer;


import React, { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeClinicalNote, generateClinicalSummary } from '@use-cases/ai';
import { logEvent } from '@use-cases/logger';
import type { AIAnalysisResult } from '@shared/types';
import { z } from 'zod';
import { PendingTask } from '@shared/types';
import { buildTasksFromText } from '@use-cases/patient/aiTasks';
import { hasClinicalNote } from '@use-cases/patient/validation';

// Web Speech API types (not available in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UsePatientVoiceAndAIParams {
  clinicalNote: string;
  patientName?: string;
  setClinicalNote: React.Dispatch<React.SetStateAction<string>>;
  setDiagnosis: React.Dispatch<React.SetStateAction<string>>;
  setPendingTasks: React.Dispatch<React.SetStateAction<PendingTask[]>>;
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

const usePatientVoiceAndAI = ({
  clinicalNote,
  patientName,
  setClinicalNote,
  setDiagnosis,
  setPendingTasks,
  addToast,
}: UsePatientVoiceAndAIParams) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setClinicalNote(prev => prev + ' ' + finalTranscript);
        }
      };
    }
  }, [setClinicalNote]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return addToast('error', 'Navegador no soporta voz');
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      addToast('info', 'Escuchando...');
    }
  }, [addToast, isListening]);

  const handleAIAnalysis = useCallback(async () => {
    if (!hasClinicalNote(clinicalNote)) return addToast('info', 'Escribe una nota primero');
    setIsAnalyzing(true);
    try {
      const result = await analyzeClinicalNote(clinicalNote);

      const AIResultSchema = z.object({
        structuredDiagnosis: z.string(),
        extractedTasks: z.array(z.string()),
      });

      const validation = AIResultSchema.safeParse(result as AIAnalysisResult);
      if (!validation.success) {
        logEvent('error', 'AI', 'Validation failed', { error: validation.error });
        throw new Error("La respuesta de la IA no tiene el formato correcto.");
      }

      if (result.structuredDiagnosis) {
        setDiagnosis(prev => (prev ? `${prev} | ${result.structuredDiagnosis}` : result.structuredDiagnosis));
      }
      const newTasks: PendingTask[] = buildTasksFromText(result.extractedTasks);
      setPendingTasks(prev => [...prev, ...newTasks]);
      addToast('success', 'Análisis IA completado');
    } catch (error: any) {
      addToast('error', `Error AI: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [addToast, clinicalNote, setDiagnosis, setPendingTasks]);

  const handleClinicalSummary = useCallback(async () => {
    if (!hasClinicalNote(clinicalNote)) return addToast('info', 'No hay notas para resumir');
    setIsSummarizing(true);
    try {
      const summary = await generateClinicalSummary(patientName || 'Paciente', [clinicalNote]);
      setClinicalNote(prev => `${prev}\n\n[RESUMEN IA]: ${summary}`);
      addToast('success', 'Resumen generado');
    } catch (error: any) {
      addToast('error', `Error Summary: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  }, [addToast, clinicalNote, patientName, setClinicalNote]);

  return {
    isAnalyzing,
    isSummarizing,
    isListening,
    toggleListening,
    handleAIAnalysis,
    handleClinicalSummary,
  };
};

export default usePatientVoiceAndAI;

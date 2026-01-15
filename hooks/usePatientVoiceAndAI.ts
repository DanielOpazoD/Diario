import React, { useEffect, useRef, useState } from 'react';
import { analyzeClinicalNote, generateClinicalSummary } from '../services/geminiService';
import { PendingTask } from '../types';

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
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
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

  const toggleListening = () => {
    if (!recognitionRef.current) return addToast('error', 'Navegador no soporta voz');
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      addToast('info', 'Escuchando...');
    }
  };

  const handleAIAnalysis = async () => {
    if (!clinicalNote.trim()) return addToast('info', 'Escribe una nota primero');
    setIsAnalyzing(true);
    try {
      const result = await analyzeClinicalNote(clinicalNote);
      if (result.structuredDiagnosis) {
        setDiagnosis(prev => (prev ? `${prev} | ${result.structuredDiagnosis}` : result.structuredDiagnosis));
      }
      const newTasks: PendingTask[] = result.extractedTasks.map(text => ({
        id: crypto.randomUUID(),
        text,
        isCompleted: false,
      }));
      setPendingTasks(prev => [...prev, ...newTasks]);
      addToast('success', 'Análisis IA completado');
    } catch (error: any) {
      addToast('error', `Error AI: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClinicalSummary = async () => {
    if (!clinicalNote.trim()) return addToast('info', 'No hay notas para resumir');
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
  };

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

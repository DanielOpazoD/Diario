import { AIAnalysisResult, ExtractedPatientData } from '@shared/types';
import { fetchWithRetry } from "./httpClient";
import { emitStructuredLog } from "./logger";

interface GeminiStatus {
  status: string;
  length: number;
  keyPreview: string;
}

const callGemini = async <T>(payload: Record<string, unknown>): Promise<T> => {
  const response = await fetchWithRetry("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, { retries: 1 });

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    // If parsing fails, it's likely HTML or empty
    if (!response.ok) {
      if (response.status === 504) {
        throw new Error("El sistema tardó demasiado en procesar este documento (Netlify Timeout). El PDF podría ser muy complejo o la conexión es lenta. Por favor, intenta de nuevo o con un archivo más simple.");
      }
      throw new Error(`Error del servidor (${response.status}): No se pudo procesar la respuesta.`);
    }
    throw new Error("La respuesta de la IA no tiene un formato válido.");
  }

  if (!response.ok || data.error) {
    if (response.status === 404) {
      throw new Error("No se encontró la función de IA. Si estás en modo local, asegúrate de estar corriendo 'netlify dev'.");
    }
    const message = data?.error || "Error al comunicarse con Gemini.";
    throw new Error(message);
  }

  return data.result as T;
};

export const validateEnvironment = async (): Promise<GeminiStatus> => {
  try {
    const status = await callGemini<GeminiStatus>({ action: "status" });
    return status;
  } catch (error) {
    emitStructuredLog("error", "Gemini", "Status check failed", { error: String(error) });
    return { status: "Missing", length: 0, keyPreview: "none" };
  }
};

export const analyzeClinicalNote = async (noteText: string): Promise<AIAnalysisResult> => {
  try {
    return await callGemini<AIAnalysisResult>({ action: "analyzeNote", noteText });
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Analyze note failed", { error: String(error) });
    throw new Error("Error al analizar la nota clínica.");
  }
};

export const extractPatientDataFromImage = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedPatientData | null> => {
  try {
    return await callGemini<ExtractedPatientData | null>({
      action: "extractPatient",
      base64Image,
      mimeType,
    });
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Vision extraction failed", { error: String(error) });
    throw error;
  }
};

export const extractMultiplePatientsFromImage = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedPatientData[]> => {
  try {
    const result = await callGemini<{ patients: ExtractedPatientData[] }>({
      action: "extractPatientList",
      base64Image,
      mimeType,
    });
    return result.patients || [];
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Vision list extraction failed", { error: String(error) });
    throw new Error("Error al procesar la lista de pacientes.");
  }
};

export const extractPatientDataFromText = async (
  extractedText: string
): Promise<ExtractedPatientData | null> => {
  try {
    return await callGemini<ExtractedPatientData | null>({
      action: "extractPatientFromText",
      extractedText,
    });
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Text extraction failed", { error: String(error) });
    throw error;
  }
};

export interface FileContent {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export const askAboutImages = async (prompt: string, images: FileContent[]): Promise<string> => {
  try {
    return await callGemini<string>({ action: "askAboutImages", prompt, images });
  } catch (error: any) {
    const message = error?.message || "No se pudo generar respuesta sobre las imágenes.";
    emitStructuredLog("error", "Gemini", "Ask about images failed", { error: String(error) });
    throw new Error(`${message} Verifica la clave de Gemini y que los archivos sean compatibles (imágenes o PDF).`);
  }
};

export const generateClinicalSummary = async (patientName: string, notes: string[]): Promise<string> => {
  try {
    return await callGemini<string>({
      action: "generateSummary",
      patientName,
      notes: notes.join("\n---\n")
    });
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Clinical summary failed", { error: String(error) });
    throw new Error("Error al generar el resumen clínico.");
  }
};

export const searchPatientsSemantically = async (query: string, patientData: { id: string, context: string }[]): Promise<string[]> => {
  try {
    return await callGemini<string[]>({
      action: "semanticSearch",
      query,
      patientData
    });
  } catch (error: any) {
    emitStructuredLog("error", "Gemini", "Semantic search failed", { error: String(error) });
    throw new Error("Error en la búsqueda semántica.");
  }
};

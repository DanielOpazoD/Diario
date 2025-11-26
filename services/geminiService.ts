import { AIAnalysisResult, ExtractedPatientData } from "../types";

interface GeminiStatus {
  status: string;
  length: number;
  keyPreview: string;
}

const callGemini = async <T>(payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
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
    console.error("Gemini status error:", error);
    return { status: "Missing", length: 0, keyPreview: "none" };
  }
};

export const analyzeClinicalNote = async (noteText: string): Promise<AIAnalysisResult> => {
  try {
    return await callGemini<AIAnalysisResult>({ action: "analyzeNote", noteText });
  } catch (error: any) {
    console.error("Gemini Error:", error);
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
    console.error("Gemini Vision Error:", error);
    throw new Error("Error al leer la imagen.");
  }
};

export const extractMultiplePatientsFromImage = async (
  base64Image: string,
  mimeType: string
): Promise<ExtractedPatientData[]> => {
  try {
    return await callGemini<ExtractedPatientData[]>({
      action: "extractPatientList",
      base64Image,
      mimeType,
    });
  } catch (error: any) {
    console.error("Gemini Vision List Error:", error);
    throw new Error("Error al procesar la lista de pacientes.");
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
    console.error("Gemini Chat Error:", error);
    return "No se pudo generar respuesta sobre las imágenes.";
  }
};

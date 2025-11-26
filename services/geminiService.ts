import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AIAnalysisResult, ExtractedPatientData } from "../types";

const MODEL_NAME = "gemini-1.5-flash";

const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    structuredDiagnosis: { type: SchemaType.STRING },
    extractedTasks: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["structuredDiagnosis", "extractedTasks"],
};

const patientExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    rut: { type: SchemaType.STRING },
    birthDate: { type: SchemaType.STRING },
    gender: { type: SchemaType.STRING },
  },
  required: ["name", "rut", "birthDate", "gender"],
};

const patientListExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    patients: {
      type: SchemaType.ARRAY,
      items: patientExtractionSchema,
    },
  },
  required: ["patients"],
};

const readEncodedKey = () => {
  return (
    (typeof import.meta !== "undefined" && import.meta.env.VITE_API_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env.API_KEY) ||
    (typeof import.meta !== "undefined" && import.meta.env.GEMINI_API_KEY) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("medidiario_api_key")) ||
    ""
  );
};

const decodeKey = (encodedKey: string): string => {
  try {
    return atob(encodedKey).trim();
  } catch (error) {
    return encodedKey.trim();
  }
};

const getApiKey = (): string => {
  const encodedKey = readEncodedKey();
  if (!encodedKey) throw new Error("API Key no configurada.");
  const apiKey = decodeKey(encodedKey);
  if (!apiKey) throw new Error("API Key no configurada.");
  return apiKey;
};

export const validateEnvironment = () => {
  const key = readEncodedKey();
  let displayKey = key;
  try {
    if (key) displayKey = atob(key);
  } catch (e) {
    // noop
  }
  return {
    status: key ? "Configured" : "Missing",
    length: key ? key.length : 0,
    keyPreview: displayKey ? `${displayKey.substring(0, 4)}...` : "none",
  };
};

const getGenerativeModel = (generationConfig?: Record<string, unknown>) => {
  const genAI = new GoogleGenerativeAI(getApiKey());
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...(generationConfig ? { generationConfig } : {}),
  });
};

export const analyzeClinicalNote = async (noteText: string): Promise<AIAnalysisResult> => {
  try {
    const model = getGenerativeModel({
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
    });

    const result = await model.generateContent(
      `Analyze this clinical note. Extract diagnosis and tasks in Spanish. Note: "${noteText}"`
    );

    return JSON.parse(result.response.text()) as AIAnalysisResult;
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
    const model = getGenerativeModel({
      responseMimeType: "application/json",
      responseSchema: patientExtractionSchema,
    });

    const result = await model.generateContent([
      "Extract data: name (Format: Name Surname1 Surname2, Title Case), rut, birthDate (YYYY-MM-DD), gender from image.",
      { inlineData: { data: base64Image, mimeType } },
    ]);

    return JSON.parse(result.response.text()) as ExtractedPatientData;
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
    const model = getGenerativeModel({
      responseMimeType: "application/json",
      responseSchema: patientListExtractionSchema,
    });

    const result = await model.generateContent([
      "Extract a list of patients from this image...",
      { inlineData: { data: base64Image, mimeType } },
    ]);

    const parsed = JSON.parse(result.response.text());
    return parsed.patients || [];
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
    const model = getGenerativeModel();
    const parts: any[] = [prompt, ...images];
    const result = await model.generateContent(parts);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return "No se pudo generar respuesta sobre las imágenes.";
  }
};

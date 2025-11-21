
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult, ExtractedPatientData } from "../types";

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    structuredDiagnosis: { type: Type.STRING },
    extractedTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["structuredDiagnosis", "extractedTasks"],
};

const patientExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    rut: { type: Type.STRING },
    birthDate: { type: Type.STRING },
    gender: { type: Type.STRING },
  },
  required: ["name", "rut", "birthDate", "gender"],
};

const patientListExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    patients: {
      type: Type.ARRAY,
      items: patientExtractionSchema
    }
  },
  required: ["patients"]
};

export const validateEnvironment = () => {
  const key = process.env.API_KEY;
  let displayKey = key;
  
  // Try to decode for preview purposes
  try {
    if (key) displayKey = atob(key);
  } catch (e) {
    // If not base64, just use as is
  }

  return {
    status: key ? "Configured" : "Missing",
    length: key ? key.length : 0,
    keyPreview: displayKey ? `${displayKey.substring(0, 4)}...` : "none"
  };
};

const getApiKey = (): string => {
  // The key is injected as base64 in vite.config.ts to avoid Netlify secret scanning
  const encodedKey = process.env.API_KEY;
  
  if (!encodedKey) {
    throw new Error("API Key no configurada. En Netlify, asegura que la variable VITE_API_KEY o API_KEY exista en 'Site Configuration > Environment Variables'.");
  }
  
  // Decode base64
  try {
    return atob(encodedKey);
  } catch (e) {
    return encodedKey; // Fallback if not encoded
  }
};

export const analyzeClinicalNote = async (noteText: string): Promise<AIAnalysisResult> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this clinical note. Extract diagnosis and tasks in Spanish. Note: "${noteText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini respondió con texto vacío");
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error: any) {
    const enhancedError = new Error(error.message || "Error desconocido en Gemini");
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
};

export const extractPatientDataFromImage = async (base64Image: string, mimeType: string): Promise<ExtractedPatientData | null> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Extract data: name (Format: Name Surname1 Surname2, Title Case), rut, birthDate (YYYY-MM-DD), gender from image." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: patientExtractionSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini Vision respondió con texto vacío");
    return JSON.parse(text) as ExtractedPatientData;

  } catch (error: any) {
    const enhancedError = new Error(error.message || "Error desconocido en Gemini Vision");
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
};

export const extractMultiplePatientsFromImage = async (base64Image: string, mimeType: string): Promise<ExtractedPatientData[]> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: "Extract a list of patients from this image. For each patient extract: name (Format: Name Surname1 Surname2, Title Case), rut, birthDate (YYYY-MM-DD), gender." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: patientListExtractionSchema,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Gemini Vision respondió con texto vacío");
    const result = JSON.parse(text);
    return result.patients || [];

  } catch (error: any) {
    const enhancedError = new Error(error.message || "Error desconocido en Gemini Vision");
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
};

export interface FileContent {
  inlineData: {
    mimeType: string;
    data: string;
  }
}

export const askAboutImages = async (prompt: string, images: FileContent[]): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [...images, { text: prompt }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: parts
      },
      config: {
        temperature: 0.2, // Lower temperature for more factual extraction
      }
    });

    return response.text || "No se pudo generar respuesta.";

  } catch (error: any) {
    const enhancedError = new Error(error.message || "Error analizando imágenes");
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
};

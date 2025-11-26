import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

type GeminiAction =
  | 'status'
  | 'analyzeNote'
  | 'extractPatient'
  | 'extractPatientList'
  | 'askAboutImages';

type GeminiRequest =
  | { action: 'status' }
  | { action: 'analyzeNote'; noteText: string }
  | { action: 'extractPatient'; base64Image: string; mimeType: string }
  | { action: 'extractPatientList'; base64Image: string; mimeType: string }
  | { action: 'askAboutImages'; prompt: string; images: any[] };

const MODEL_NAME = 'gemini-1.5-flash';
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    structuredDiagnosis: { type: SchemaType.STRING },
    extractedTasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: ['structuredDiagnosis', 'extractedTasks'],
};

const patientExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    rut: { type: SchemaType.STRING },
    birthDate: { type: SchemaType.STRING },
    gender: { type: SchemaType.STRING },
  },
  required: ['name', 'rut', 'birthDate', 'gender'],
};

const patientListExtractionSchema = {
  type: SchemaType.OBJECT,
  properties: { patients: { type: SchemaType.ARRAY, items: patientExtractionSchema } },
  required: ['patients'],
};

const withModel = (generationConfig?: Record<string, unknown>) => {
  if (!genAI) {
    throw new Error('Gemini API key no configurada en el entorno del servidor.');
  }

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    ...(generationConfig ? { generationConfig } : {}),
  });
};

const parseBody = (event: HandlerEvent): GeminiRequest => {
  if (!event.body) throw new Error('Falta el cuerpo de la solicitud.');

  const payload = JSON.parse(event.body) as GeminiRequest & { action?: GeminiAction };
  if (!payload.action) throw new Error('Acción de Gemini no especificada.');
  return payload as GeminiRequest;
};

const handler: Handler = async (event) => {
  try {
    const payload = parseBody(event);

    if (payload.action === 'status') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: apiKey ? 'Configured' : 'Missing',
          length: apiKey ? apiKey.length : 0,
          keyPreview: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
        }),
      };
    }

    const model = withModel();

    switch (payload.action) {
      case 'analyzeNote': {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Analyze this clinical note. Extract diagnosis and tasks in Spanish.',
                },
                { text: payload.noteText },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', responseSchema: analysisSchema },
        });

        return { statusCode: 200, body: JSON.stringify({ result: JSON.parse(result.response.text()) }) };
      }

      case 'extractPatient': {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: 'Extract data: name (Format: Name Surname1 Surname2, Title Case), rut, birthDate (YYYY-MM-DD), gender from image.',
                },
                { inlineData: { data: payload.base64Image, mimeType: payload.mimeType } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', responseSchema: patientExtractionSchema },
        });

        return { statusCode: 200, body: JSON.stringify({ result: JSON.parse(result.response.text()) }) };
      }

      case 'extractPatientList': {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'Extract a list of patients from this image...' },
                { inlineData: { data: payload.base64Image, mimeType: payload.mimeType } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', responseSchema: patientListExtractionSchema },
        });

        return { statusCode: 200, body: JSON.stringify({ result: JSON.parse(result.response.text()) }) };
      }

      case 'askAboutImages': {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [payload.prompt, ...(payload.images || [])],
            },
          ],
        });

        return { statusCode: 200, body: JSON.stringify({ result: result.response.text() }) };
      }

      default:
        return { statusCode: 400, body: JSON.stringify({ error: 'Acción no soportada' }) };
    }
  } catch (error: any) {
    console.error('Gemini function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Error interno en Gemini.' }) };
  }
};

export { handler };

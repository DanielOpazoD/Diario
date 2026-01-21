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

const MODEL_NAME = 'gemini-2.0-flash';
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_API_KEY || '';
const genAI = apiKey && apiKey !== 'your_gemini_key_here' ? new GoogleGenerativeAI(apiKey) : null;

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
    diagnosis: { type: SchemaType.STRING },
    clinicalNote: { type: SchemaType.STRING },
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
                  text:
                    'Extract Hanga Roa hospital data (Spanish). Be concise.\n' +
                    '- name: "Name Surname". Title Case.\n' +
                    '- rut: Full RUT.\n' +
                    '- birthDate: YYYY-MM-DD.\n' +
                    '- gender: Sex/Gender.\n' +
                    '- diagnosis: Use only "HIPOTESIS DIAGNÓSTICA". IGNORE "DIAGNÓSTICO PRI" (CIE-10). STOP before "Comentario" or "Plan".\n' +
                    '- clinicalNote: All text from "INDICACIONES", "PLAN", "EVOLUCIÓN", "TRATAMIENTO", or "Comentario".',
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
                {
                  text:
                    'Extract patient list (Spanish). Concise fields.\n' +
                    '- name: "Name Surname". Title Case.\n' +
                    '- rut: Full RUT.\n' +
                    '- birthDate: YYYY-MM-DD.\n' +
                    '- gender: Sex/Gender.\n' +
                    '- diagnosis: Use only "HIPOTESIS DIAGNÓSTICA". IGNORE "DIAGNÓSTICO PRI" (CIE-10). STOP before "Comentario" or "Plan".\n' +
                    '- clinicalNote: Text from "INDICACIONES", "PLAN", "EVOLUCIÓN", "TRATAMIENTO", or "Comentario".',
                },
                { inlineData: { data: payload.base64Image, mimeType: payload.mimeType } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', responseSchema: patientListExtractionSchema },
        });

        return { statusCode: 200, body: JSON.stringify({ result: JSON.parse(result.response.text()) }) };
      }

      case 'askAboutImages': {
        const promptText = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
        const imageParts = (payload.images || [])
          .map((image: any) => {
            const inlineData = image?.inlineData ?? image;
            if (!inlineData?.mimeType || !inlineData?.data) return null;

            return {
              inlineData: {
                mimeType: inlineData.mimeType,
                data: typeof inlineData.data === 'string' ? inlineData.data.trim() : inlineData.data,
              },
            };
          })
          .filter(Boolean) as any[];

        if (!promptText) {
          throw new Error('Se requiere un prompt para analizar los archivos.');
        }

        if (imageParts.length === 0) {
          throw new Error('No se recibieron archivos compatibles (imágenes o PDF).');
        }

        const parts = [{ text: promptText }, ...imageParts];

        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts,
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

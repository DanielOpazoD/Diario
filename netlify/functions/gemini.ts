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
    nombre_completo: { type: SchemaType.STRING },
    rut: { type: SchemaType.STRING },
    fecha_nacimiento: { type: SchemaType.STRING },
    diagnostico: { type: SchemaType.STRING },
    plan: { type: SchemaType.STRING },
    fecha_ingreso: { type: SchemaType.STRING },
  },
  required: ['nombre_completo', 'rut', 'fecha_nacimiento', 'diagnostico', 'plan', 'fecha_ingreso'],
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
                    'Actúa como un asistente de extracción de datos médicos. Recibirás el texto crudo de un registro clínico en formato PDF. Tu objetivo es extraer entidades específicas y formatearlas estrictamente como un objeto JSON.\n\nExtrae los siguientes campos basándote en las etiquetas del texto:\n- nombre_completo: Busca bajo la etiqueta "NOMBRES:". Si hay texto en la línea siguiente que parece un apellido, concaténalo.\n- rut: Extrae el valor numérico bajo la etiqueta "RUT:".\n- fecha_nacimiento: Extrae la fecha bajo "NACIMIENTO:".\n- diagnostico: Extrae el texto que aparece inmediatamente debajo de "HIPOTESIS DIAGNÓSTICA:".\n- plan: Extrae todo el texto que aparece bajo "INDICACIONES MÉDICAS / PLAN DE TTO:" hasta encontrar la siguiente etiqueta (como "DIAGNÓSTICO PRI" o similar). Únelo en un solo string.\n- fecha_ingreso: Extrae la fecha bajo "FECHA ING:".\n\nResponde ÚNICAMENTE con el JSON. Formato de fecha estándar: DD-MM-YYYY.',
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
                    'Extrae una lista de pacientes de este documento. Para cada paciente busca:\n- nombre_completo: Bajo la etiqueta "NOMBRES:".\n- rut: Bajo la etiqueta "RUT:".\n- fecha_nacimiento: Bajo "NACIMIENTO:".\n- diagnostico: Bajo "HIPOTESIS DIAGNÓSTICA:".\n- plan: Bajo "INDICACIONES MÉDICAS / PLAN DE TTO:".\n- fecha_ingreso: Bajo "FECHA ING:".\n\nResponde estrictamente en formato JSON utilizando el esquema proporcionado. Formato de fecha estándar: DD-MM-YYYY.',
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

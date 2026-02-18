import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

type GeminiAction =
  | 'status'
  | 'analyzeNote'
  | 'extractPatient'
  | 'extractPatientFromText'
  | 'extractPatientList'
  | 'askAboutImages'
  | 'extractLabResults';

type GeminiRequest =
  | { action: 'status' }
  | { action: 'analyzeNote'; noteText: string }
  | { action: 'extractPatient'; base64Image: string; mimeType: string }
  | { action: 'extractPatientFromText'; extractedText: string }
  | { action: 'extractPatientList'; base64Image: string; mimeType: string }
  | { action: 'askAboutImages'; prompt: string; images: any[] }
  | { action: 'extractLabResults'; base64Image?: string; mimeType?: string; extractedText?: string };

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
                    '- diagnosis: Use ONLY "HIPOTESIS DIAGNÓSTICA". IGNORE "DIAGNÓSTICO PRI". STOP strictly at "INDICACIONES MÉDICAS / PLAN DE TTO", "Comentario", or any other section.\n' +
                    '- clinicalNote: Content from "INDICACIONES MÉDICAS / PLAN DE TTO", "PLAN", "EVOLUCIÓN", or "Comentario". CRITICAL: DO NOT include the headers (like "INDICACIONES MÉDICAS / PLAN DE TTO:") in the value.',
                },
                { inlineData: { data: payload.base64Image, mimeType: payload.mimeType } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json', responseSchema: patientExtractionSchema },
        });

        return { statusCode: 200, body: JSON.stringify({ result: JSON.parse(result.response.text()) }) };
      }

      case 'extractPatientFromText': {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text:
                    'Extrae datos de paciente desde texto clínico (español). Devuelve solo el JSON válido.\n' +
                    '- name: "Nombre Apellido" en Title Case.\n' +
                    '- rut: RUT completo si está.\n' +
                    '- birthDate: YYYY-MM-DD.\n' +
                    '- gender: Masculino/Femenino/Otro.\n' +
                    '- diagnosis: SOLO "HIPOTESIS DIAGNÓSTICA" si existe.\n' +
                    '- clinicalNote: "INDICACIONES MÉDICAS / PLAN DE TTO", "PLAN", "EVOLUCIÓN" o "Comentario" sin encabezados.',
                },
                { text: payload.extractedText },
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
                    '- diagnosis: Use ONLY "HIPOTESIS DIAGNÓSTICA". IGNORE "DIAGNÓSTICO PRI". STOP at "INDICACIONES MÉDICAS" or "Plan".\n' +
                    '- clinicalNote: Content from "INDICACIONES MÉDICAS / PLAN DE TTO", "PLAN", or "EVOLUCIÓN". STRIP labels from the text.',
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

      case 'extractLabResults': {
        const textPart = payload.extractedText ? { text: payload.extractedText } : null;
        const imagePart = (payload.base64Image && payload.mimeType)
          ? { inlineData: { data: payload.base64Image, mimeType: payload.mimeType } }
          : null;

        if (!textPart && !imagePart) {
          throw new Error('Se requiere texto o imagen para extraer resultados de laboratorio.');
        }

        const prompt = `Extrae los resultados de exámenes de laboratorio de forma notificativa y resumida en un párrafo continuo (formato clínico). 
Usa estrictamente las siguientes abreviaturas si los datos están presentes:
Fecha examenes (dia-mes-año): HTO Hg RGB %PMN Plaquetas Creat BUN Na K Cl HCO3 GOT GPT GGT FA BT BD Hbglic RAC
Colesterol total LDL TG HDL TSH T4L
Sedimento de orina: GR LEU Bacterias.

Explicación de abreviaturas para tu conocimiento:
HTO=hematocrito, Hg=hemoglobina, RGB=recuento de glóbulos blancos, %PMN=polimorfonucleares, Plaquetas, Creat=creatinina, BUN=nitrógeno ureico, Na=sodio, K=potasio, Cl=cloro, HCO3=bicarbonato, GOT/GPT/GGT/FA=pruebas hepáticas, BT/BD=bilirrubina total/directa, Hbglic=hemoglobina glicosilada, RAC=relación albúmina/creatinina, TSH/T4L=perfil tiroideo.

Si algún examen no está en el documento, simplemente omítelo del párrafo. No inventes datos. 
La respuesta debe ser SOLO el párrafo con los resultados.`;

        const contents = [
          {
            role: 'user',
            parts: [
              { text: prompt },
              ...(textPart ? [textPart] : []),
              ...(imagePart ? [imagePart] : [])
            ] as any,
          },
        ];

        const result = await model.generateContent({ contents });
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

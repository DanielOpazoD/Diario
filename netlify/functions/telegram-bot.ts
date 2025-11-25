import { Readable } from 'node:stream';
import { google, drive_v3 } from 'googleapis';
import { Telegraf, type Context } from 'telegraf';
import { GoogleGenerativeAI } from '@google/genai';

interface HandlerEvent {
  body: string | null;
  httpMethod: string;
  headers?: Record<string, string>;
}

interface HandlerResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? process.env.SERVICE_ACCOUNT_JSON;

if (!BOT_TOKEN || !GEMINI_API_KEY || !DRIVE_FOLDER_ID || !SERVICE_ACCOUNT_JSON) {
  console.warn('Missing required environment variables for Telegram bot function.');
}

const credentials = (() => {
  if (!SERVICE_ACCOUNT_JSON) return undefined;
  try {
    return JSON.parse(SERVICE_ACCOUNT_JSON);
  } catch (err) {
    // Try base64 decoding if direct parse fails
    try {
      const decoded = Buffer.from(SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Unable to parse service account credentials.', error);
      return undefined;
    }
  }
})();

const auth = credentials
  ? new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    })
  : undefined;

const drive: drive_v3.Drive | undefined = auth ? google.drive({ version: 'v3', auth }) : undefined;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : undefined;
const model = genAI?.getGenerativeModel({ model: 'gemini-2.5-flash' });

const bot = BOT_TOKEN ? new Telegraf(BOT_TOKEN) : undefined;

const prompt = `Eres un asistente médico. Analiza el texto y clasifícalo solo en dos categorías: 
- "Borrador de Paciente": incluye datos clínicos (nombre, RUT/ID, diagnóstico, antecedentes, indicaciones o signos vitales).
- "Nota Simple": notas rápidas sin datos clínicos identificables.
Devuelve únicamente un JSON válido (sin texto adicional) con esta forma:
{
  "tipo": "BorradorPaciente" | "NotaSimple",
  "resumen": "Resumen breve en español",
  "camposClinicos": {
    "paciente": "Nombre o null",
    "identificador": "RUT/ID si existe, sino null",
    "diagnostico": "Diagnóstico o null",
    "indicaciones": "Indicaciones o null",
    "otros": "Cualquier dato relevante"
  }
}`;

async function saveJsonToDrive(data: unknown, filename: string) {
  if (!drive) throw new Error('Google Drive client not initialized');

  const buffer = Buffer.from(JSON.stringify(data, null, 2));
  const stream = Readable.from(buffer);

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID as string],
      mimeType: 'application/json',
    },
    media: {
      mimeType: 'application/json',
      body: stream,
    },
    fields: 'id',
  });
}

async function uploadTelegramFile(fileId: string, filename: string, mimeTypeHint?: string) {
  if (!bot) throw new Error('Bot not initialized');
  if (!drive) throw new Error('Google Drive client not initialized');

  const fileUrl = await bot.telegram.getFileLink(fileId);
  const response = await fetch(fileUrl.toString());

  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar el archivo: ${response.statusText}`);
  }

  const mimeType = mimeTypeHint ?? response.headers.get('content-type') ?? 'application/octet-stream';

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID as string],
      mimeType,
    },
    media: {
      mimeType,
      body: response.body as unknown as NodeJS.ReadableStream,
    },
    fields: 'id',
  });
}

function extractJson(text?: string): Record<string, unknown> | null {
  if (!text) return null;

  const codeBlock = /```json\s*([\s\S]*?)```/i.exec(text);
  const candidate = codeBlock?.[1] ?? text;

  try {
    return JSON.parse(candidate.trim());
  } catch (err) {
    console.error('No se pudo parsear JSON devuelto por Gemini', err);
    return null;
  }
}

async function handleText(ctx: Context) {
  if (!model) throw new Error('Gemini model not initialized');
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
  if (!messageText) return;

  const result = await model.generateContent([{ text: prompt }, { text: messageText }]);
  const responseText = result.response.text();
  const parsed = extractJson(responseText);

  if (!parsed) {
    await ctx.reply('No pude estructurar la nota. Intenta nuevamente.');
    return;
  }

  const filename = `nota-${Date.now()}-${ctx.message?.message_id}.json`;
  await saveJsonToDrive(parsed, filename);
  await ctx.reply('✅ Nota procesada y guardada en tu bandeja MediDiario.');
}

async function handleFile(ctx: Context) {
  if (!ctx.message) return;

  const documentMessage = 'document' in ctx.message ? ctx.message.document : undefined;
  const photoMessage = 'photo' in ctx.message ? ctx.message.photo : undefined;

  try {
    if (documentMessage) {
      const filename = documentMessage.file_name ?? `documento-${Date.now()}`;
      await uploadTelegramFile(documentMessage.file_id, filename, documentMessage.mime_type ?? undefined);
      await ctx.reply('📎 Archivo subido a tu MediDiario Inbox.');
      return;
    }

    if (photoMessage && photoMessage.length > 0) {
      const largestPhoto = photoMessage[photoMessage.length - 1];
      const filename = `foto-${Date.now()}.jpg`;
      await uploadTelegramFile(largestPhoto.file_id, filename, 'image/jpeg');
      await ctx.reply('🖼️ Foto guardada en tu MediDiario Inbox.');
      return;
    }
  } catch (error) {
    console.error('Error subiendo archivo a Drive', error);
    await ctx.reply('⚠️ No pude subir el archivo. Intenta nuevamente.');
  }
}

if (bot) {
  bot.on('text', async (ctx) => {
    try {
      await handleText(ctx);
    } catch (error) {
      console.error('Error procesando texto', error);
      await ctx.reply('⚠️ Ocurrió un problema al procesar tu texto.');
    }
  });

  bot.on(['photo', 'document'], handleFile);
}

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'OK' };
  }

  if (!bot) {
    return { statusCode: 500, body: 'Bot not configured correctly' };
  }

  const update = event.body ? JSON.parse(event.body) : null;

  if (!update) {
    return { statusCode: 400, body: 'No update received' };
  }

  try {
    await bot.handleUpdate(update);
    return { statusCode: 200, body: 'Processed' };
  } catch (error) {
    console.error('Error manejando actualización de Telegram', error);
    return { statusCode: 500, body: 'Error processing update' };
  }
};


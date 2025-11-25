import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/genai';
import { google, drive_v3 } from 'googleapis';
import { Telegraf, Context, Telegram } from 'telegraf';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';

interface PatientDraftContent {
  name: string;
  rut: string;
  birthDate?: string;
  diagnosis: string;
  clinicalNote: string;
}

interface PatientDraftPayload {
  id: string;
  type: 'patient_draft';
  content: PatientDraftContent;
  createdAt: number;
  source: 'telegram';
}

interface ChatMessagePayload {
  id: string;
  type: 'chat_message';
  content: string;
  createdAt: number;
  source: 'telegram';
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_INBOX_ID;
const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

let driveClient: drive_v3.Drive | null = null;
let botInstance: Telegraf<Context> | null = null;
let geminiModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

const ensureDriveClient = (): drive_v3.Drive => {
  if (driveClient) return driveClient;
  if (!SERVICE_ACCOUNT_JSON) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable');
  }
  const credentials = JSON.parse(SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
};

const ensureGeminiModel = () => {
  if (geminiModel) return geminiModel;
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY env variable');
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  return geminiModel;
};

const uploadJsonToDrive = async (
  filename: string,
  description: string,
  payload: Record<string, unknown>,
) => {
  if (!DRIVE_FOLDER_ID) {
    throw new Error('Missing GOOGLE_DRIVE_INBOX_ID env variable');
  }
  const drive = ensureDriveClient();
  const media = Readable.from([JSON.stringify(payload, null, 2)]);
  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
      description,
    },
    media: {
      mimeType: 'application/json',
      body: media,
    },
    fields: 'id',
  });
};

const uploadStreamToDrive = async (
  filename: string,
  description: string,
  body: NodeJS.ReadableStream,
  mimeType?: string | null,
) => {
  if (!DRIVE_FOLDER_ID) {
    throw new Error('Missing GOOGLE_DRIVE_INBOX_ID env variable');
  }
  const drive = ensureDriveClient();
  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
      description,
    },
    media: {
      mimeType: mimeType || 'application/octet-stream',
      body,
    },
    fields: 'id',
  });
};

const extractPatientData = async (text: string): Promise<PatientDraftContent> => {
  const model = ensureGeminiModel();
  const prompt = `Extrae JSON con: {name, rut, birthDate, diagnosis, clinicalNote} del siguiente texto. Responde solo JSON válido. Texto: ${text}`;
  const result = await model.generateContent([{ text: prompt }]);
  const responseText = result.response.text();
  try {
    const normalized = responseText.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(normalized) as PatientDraftContent;
    return parsed;
  } catch (error) {
    console.error('Gemini parsing error:', error, 'Response:', responseText);
    throw new Error('No se pudo interpretar la respuesta de Gemini');
  }
};

const handlePatientDraft = async (ctx: Context) => {
  const messageText = 'text' in (ctx.message ?? {}) ? ctx.message?.text ?? '' : '';
  const cleanedText = messageText.replace(/^\/(p|ingreso)\s*/i, '').trim();
  if (!cleanedText) {
    await ctx.reply('⚠️ Debes ingresar los datos del paciente después del comando.');
    return;
  }
  try {
    const content = await extractPatientData(cleanedText);
    const id = randomUUID();
    const payload: PatientDraftPayload = {
      id,
      type: 'patient_draft',
      content,
      createdAt: Date.now(),
      source: 'telegram',
    };
    const filename = `patient_draft_${id}.json`;
    await uploadJsonToDrive(filename, 'patient_draft', payload);
    await ctx.reply(`✅ Borrador creado para: ${content.name ?? 'Paciente'}`);
  } catch (error) {
    console.error('Error creating patient draft:', error);
    await ctx.reply('❌ No pude crear el borrador, intenta de nuevo.');
  }
};

const handleTextNote = async (ctx: Context) => {
  const messageText = 'text' in (ctx.message ?? {}) ? ctx.message?.text ?? '' : '';
  if (!messageText) return;
  try {
    const id = randomUUID();
    const payload: ChatMessagePayload = {
      id,
      type: 'chat_message',
      content: messageText,
      createdAt: Date.now(),
      source: 'telegram',
    };
    const filename = `note_${id}.json`;
    await uploadJsonToDrive(filename, 'note', payload);
    await ctx.reply('📝 Nota guardada');
  } catch (error) {
    console.error('Error saving note:', error);
    await ctx.reply('❌ No pude guardar la nota.');
  }
};

const getFileInfo = (ctx: Context) => {
  const message: any = ctx.message;
  if (!message) return null;

  if (message.document) {
    return {
      fileId: message.document.file_id as string,
      filename: message.document.file_name as string,
      mimeType: message.document.mime_type as string | undefined,
    };
  }

  if (message.photo && Array.isArray(message.photo)) {
    const photo = message.photo[message.photo.length - 1];
    return {
      fileId: photo.file_id as string,
      filename: `${photo.file_unique_id}.jpg`,
      mimeType: 'image/jpeg',
    };
  }

  if (message.audio) {
    return {
      fileId: message.audio.file_id as string,
      filename: message.audio.file_name || `${message.audio.file_unique_id}.mp3`,
      mimeType: message.audio.mime_type as string | undefined,
    };
  }

  if (message.video) {
    return {
      fileId: message.video.file_id as string,
      filename: `${message.video.file_unique_id}.mp4`,
      mimeType: message.video.mime_type as string | undefined,
    };
  }

  if (message.voice) {
    return {
      fileId: message.voice.file_id as string,
      filename: `${message.voice.file_unique_id}.ogg`,
      mimeType: message.voice.mime_type as string | undefined,
    };
  }

  return null;
};

const handleFileMessage = async (ctx: Context, telegram: Telegram) => {
  const info = getFileInfo(ctx);
  if (!info) return false;
  try {
    const fileLink = await telegram.getFileLink(info.fileId);
    const url = typeof fileLink === 'string' ? fileLink : fileLink.href;
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`No pude descargar el archivo: ${response.status}`);
    }
    const stream = Readable.fromWeb(response.body as any);
    await uploadStreamToDrive(info.filename, 'unclassified_item', stream, info.mimeType ?? response.headers.get('content-type'));
    await ctx.reply(`📎 Archivo guardado: ${info.filename}`);
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    await ctx.reply('❌ No pude guardar el archivo.');
    return true;
  }
};

const getBot = () => {
  if (botInstance) return botInstance;
  if (!TELEGRAM_TOKEN) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN env variable');
  }
  const bot = new Telegraf(TELEGRAM_TOKEN, {
    handlerTimeout: 9_000,
  });

  bot.command(['p', 'ingreso'], async (ctx) => handlePatientDraft(ctx));

  bot.on('message', async (ctx, next) => {
    // Evita procesar dos veces los comandos
    if (ctx.message?.entities?.some((entity) => entity.type === 'bot_command')) {
      return next();
    }

    const handledFile = await handleFileMessage(ctx, ctx.telegram);
    if (handledFile) return;

    if ('text' in (ctx.message ?? {})) {
      await handleTextNote(ctx);
    }
  });

  bot.catch((err) => {
    console.error('Telegraf error:', err);
  });

  botInstance = bot;
  return botInstance;
};

export const handler: Handler = async (event) => {
  try {
    const bot = getBot();
    const update = JSON.parse(event.body || '{}');
    await bot.handleUpdate(update);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error: any) {
    console.error('Error en handler:', error);
    // Telegram requiere 200 OK para no reintentar indefinidamente
    return { statusCode: 200, body: JSON.stringify({ error: error?.message || 'Unexpected error' }) };
  }
};

export default handler;

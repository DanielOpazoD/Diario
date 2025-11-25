import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/genai';
import { google, drive_v3 } from 'googleapis';
import { Telegraf } from 'telegraf';
import type { Context, Update } from 'telegraf';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

interface TelegramUserInfo {
  id: number;
  username?: string;
  firstName: string;
}

interface PatientDraft {
  id: string;
  type: 'patient_draft';
  content: {
    name: string;
    rut: string;
    birthDate?: string | null;
    diagnosis: string;
    clinicalNote: string;
  };
  createdAt: number;
  source: 'telegram';
  telegramUser: TelegramUserInfo;
}

interface ChatMessage {
  id: string;
  type: 'chat_message';
  content: string;
  createdAt: number;
  source: 'telegram';
  telegramUser: TelegramUserInfo;
}

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const decodeEventBody = (eventBody: string | null, isBase64Encoded?: boolean): unknown => {
  if (!eventBody) return {};
  const content = isBase64Encoded ? Buffer.from(eventBody, 'base64').toString('utf-8') : eventBody;
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse event body', error);
    return {};
  }
};

const createDriveClient = (): drive_v3.Drive => {
  const rawCredentials = getEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
  const credentials = JSON.parse(rawCredentials);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
};

const createGeminiModel = () => {
  const apiKey = getEnv('GEMINI_API_KEY');
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const extractTelegramUser = (ctx: Context): TelegramUserInfo => ({
  id: ctx.from?.id ?? 0,
  username: ctx.from?.username,
  firstName: ctx.from?.first_name ?? 'Unknown',
});

const parseJsonResponse = (rawText: string): Record<string, unknown> => {
  try {
    return JSON.parse(rawText);
  } catch (primaryError) {
    // Attempt to extract JSON content from within code fences or surrounding text.
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (secondaryError) {
        console.error('Secondary JSON parse failure', secondaryError);
      }
    }
    console.error('Gemini response was not valid JSON', primaryError, rawText);
    throw new Error('Invalid JSON returned by Gemini');
  }
};

const uploadJsonToDrive = async (
  drive: drive_v3.Drive,
  folderId: string,
  payload: object,
  name: string,
  description: string,
  properties?: Record<string, string>
) => {
  const jsonString = JSON.stringify(payload, null, 2);
  const bodyStream = Readable.from([jsonString]);

  await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      description,
      properties,
    },
    media: {
      mimeType: 'application/json',
      body: bodyStream,
    },
    fields: 'id',
  });
};

const uploadStreamToDrive = async (
  drive: drive_v3.Drive,
  folderId: string,
  body: Readable,
  name: string,
  mimeType: string,
  properties: Record<string, string>
) => {
  await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      description: 'unclassified_item',
      properties,
    },
    media: {
      mimeType,
      body,
    },
    fields: 'id',
  });
};

const buildPatientPrompt = (userText: string): string => `Extrae los datos clínicos del siguiente texto y devuelve SOLO un JSON válido con esta estructura exacta:
{
  "name": "Nombre completo del paciente",
  "rut": "RUT con formato",
  "birthDate": "YYYY-MM-DD o null",
  "diagnosis": "Diagnóstico principal",
  "clinicalNote": "Texto completo de la nota clínica"
}

Texto a procesar: ${userText}`;

const handlePatientCommand = async (
  ctx: Context,
  drive: drive_v3.Drive,
  folderId: string,
  model: ReturnType<typeof createGeminiModel>
) => {
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text ?? '' : '';
  const userText = messageText.replace(/^\/(p|ingreso)\b/i, '').trim();

  if (!userText) {
    await ctx.reply('Por favor envía el texto clínico después del comando.');
    return;
  }

  const prompt = buildPatientPrompt(userText);
  const generation = await model.generateContent(prompt);
  const rawText = generation.response?.text() ?? '';
  const parsed = parseJsonResponse(rawText);

  const draft: PatientDraft = {
    id: randomUUID(),
    type: 'patient_draft',
    content: {
      name: String(parsed.name ?? ''),
      rut: String(parsed.rut ?? ''),
      birthDate: parsed.birthDate ? String(parsed.birthDate) : null,
      diagnosis: String(parsed.diagnosis ?? ''),
      clinicalNote: String(parsed.clinicalNote ?? userText),
    },
    createdAt: Date.now(),
    source: 'telegram',
    telegramUser: extractTelegramUser(ctx),
  };

  const fileName = `patient_draft_${draft.id}_${draft.createdAt}.json`;
  await uploadJsonToDrive(drive, folderId, draft, fileName, 'patient_draft');

  const shortId = draft.id.split('-')[0];
  await ctx.reply(
    `✅ Borrador creado para: ${draft.content.name}\nDiagnóstico: ${draft.content.diagnosis}\nID: ${shortId}`
  );
};

const handleChatMessage = async (ctx: Context, drive: drive_v3.Drive, folderId: string) => {
  const messageText = ctx.message && 'text' in ctx.message ? ctx.message.text ?? '' : '';
  const note: ChatMessage = {
    id: randomUUID(),
    type: 'chat_message',
    content: messageText,
    createdAt: Date.now(),
    source: 'telegram',
    telegramUser: extractTelegramUser(ctx),
  };

  const fileName = `note_${note.id}_${note.createdAt}.json`;
  await uploadJsonToDrive(drive, folderId, note, fileName, 'note');
  await ctx.reply('📝 Nota guardada');
};

const handleDocumentUpload = async (ctx: Context, drive: drive_v3.Drive, folderId: string) => {
  if (!ctx.message || ctx.message.chat.type === 'channel') return;

  const document = ctx.message && 'document' in ctx.message ? ctx.message.document : undefined;
  if (!document) return;

  const fileLink = await ctx.telegram.getFileLink(document.file_id);
  const response = await fetch(fileLink.href);

  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar el archivo: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
  const nodeStream = Readable.fromWeb(response.body as unknown as ReadableStream);

  const baseName = document.file_name ?? `document_${document.file_id}`;
  const timeSuffix = Date.now();
  const name = `${baseName}_${timeSuffix}`;

  await uploadStreamToDrive(drive, folderId, nodeStream, name, mimeType, {
    source: 'telegram',
    originalName: baseName,
  });

  await ctx.reply(`📎 Archivo guardado: ${baseName}`);
};

const handlePhotoUpload = async (ctx: Context, drive: drive_v3.Drive, folderId: string) => {
  if (!ctx.message || ctx.message.chat.type === 'channel') return;

  const photos = ctx.message && 'photo' in ctx.message ? ctx.message.photo : undefined;
  if (!photos || photos.length === 0) return;

  const largestPhoto = photos[photos.length - 1];
  const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);
  const response = await fetch(fileLink.href);

  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar la foto: ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
  const nodeStream = Readable.fromWeb(response.body as unknown as ReadableStream);

  const baseName = `photo_${largestPhoto.file_id}`;
  const name = `${baseName}_${Date.now()}.jpg`;

  await uploadStreamToDrive(drive, folderId, nodeStream, name, mimeType, {
    source: 'telegram',
    originalName: baseName,
  });

  await ctx.reply(`📎 Archivo guardado: ${baseName}`);
};

const createBot = (drive: drive_v3.Drive, folderId: string) => {
  const token = getEnv('TELEGRAM_BOT_TOKEN');
  const model = createGeminiModel();
  const bot = new Telegraf(token, { telegram: { webhookReply: false } });

  bot.catch(async (err, ctx) => {
    console.error('Bot error:', err);
    try {
      await ctx.reply('⚠️ Ocurrió un error procesando tu mensaje. Intenta nuevamente.');
    } catch (replyError) {
      console.error('Failed to send error message', replyError);
    }
  });

  bot.command(['p', 'ingreso'], (ctx) => handlePatientCommand(ctx, drive, folderId, model));

  bot.on('document', (ctx) => handleDocumentUpload(ctx, drive, folderId));
  bot.on('photo', (ctx) => handlePhotoUpload(ctx, drive, folderId));

  bot.on('text', async (ctx, next) => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text ?? '' : '';
    if (/^\/(p|ingreso)\b/i.test(text)) {
      return next();
    }
    await handleChatMessage(ctx, drive, folderId);
  });

  return bot;
};

export const handler: Handler = async (event) => {
  const drive = createDriveClient();
  const folderId = getEnv('GOOGLE_DRIVE_INBOX_ID');
  const bot = createBot(drive, folderId);

  try {
    const update = decodeEventBody(event.body, event.isBase64Encoded) as Update;
    await bot.handleUpdate(update);
  } catch (error) {
    console.error('Error handling Telegram update:', error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true }),
  };
};

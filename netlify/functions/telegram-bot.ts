import { Handler } from '@netlify/functions';
import { Telegraf } from 'telegraf';
import type { Context, NarrowedContext } from 'telegraf';
import type { Message, Update } from 'telegraf/types';
import { google } from 'googleapis';
import { GoogleAuth } from 'googleapis-common';
import { GoogleGenerativeAI } from '@google/genai';
import { randomUUID, createHash } from 'node:crypto';
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

interface EnvConfig {
  telegramToken: string;
  geminiApiKey: string;
  driveFolderId: string;
  serviceAccountJson: string;
}

const PATIENT_COMMANDS = ['p', 'ingreso'];

const buildTelegramUser = (ctx: Context): TelegramUserInfo => ({
  id: ctx.from?.id ?? 0,
  username: ctx.from?.username,
  firstName: ctx.from?.first_name ?? 'Unknown',
});

const parseEnv = (): EnvConfig => {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const driveFolderId = process.env.GOOGLE_DRIVE_INBOX_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!telegramToken || !geminiApiKey || !driveFolderId || !serviceAccountJson) {
    throw new Error('Missing required environment variables for Telegram bot handler');
  }

  return { telegramToken, geminiApiKey, driveFolderId, serviceAccountJson };
};

const createDriveClient = (serviceAccountJson: string) => {
  const credentials = JSON.parse(serviceAccountJson);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
};

const createGeminiClient = (apiKey: string) => new GoogleGenerativeAI(apiKey);

const extractTextFromMessage = (message: Message.TextMessage | Message.VoiceMessage | Message.PhotoMessage | Message.DocumentMessage) => {
  if ('text' in message && message.text) return message.text.trim();
  return '';
};

const sanitizeJson = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('```')) {
    const match = trimmed.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (match?.[1]) return match[1];
  }
  return trimmed;
};

const parseGeminiPatientDraft = (rawText: string) => {
  try {
    const cleaned = sanitizeJson(rawText);
    return JSON.parse(cleaned) as PatientDraft['content'];
  } catch (error) {
    console.error('Failed to parse Gemini response', error, rawText);
    throw new Error('No se pudo interpretar la respuesta de Gemini');
  }
};

const saveJsonToDrive = async (
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  name: string,
  description: string,
  payload: unknown,
) => {
  const body = Readable.from([JSON.stringify(payload, null, 2)]);
  await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      description,
    },
    media: {
      mimeType: 'application/json',
      body,
    },
  });
};

const streamFileToDrive = async (
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  fileUrl: string,
  name: string,
  description: string,
  properties?: Record<string, string>,
) => {
  const response = await fetch(fileUrl);
  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar el archivo desde Telegram: ${response.statusText}`);
  }

  await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
      description,
      properties,
    },
    media: {
      mimeType: response.headers.get('content-type') ?? 'application/octet-stream',
      body: response.body,
    },
  });
};

const buildPatientPrompt = (text: string) => `Extrae los datos clínicos del siguiente texto y devuelve SOLO un JSON válido con esta estructura exacta:
{
  "name": "Nombre completo del paciente",
  "rut": "RUT con formato",
  "birthDate": "YYYY-MM-DD o null",
  "diagnosis": "Diagnóstico principal",
  "clinicalNote": "Texto completo de la nota clínica"
}

Texto a procesar: ${text}`;

const handlePatientDraft = async (
  ctx: NarrowedContext<Context<Update>, Context<Update> & { message: Message.TextMessage }>,
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  gemini: GoogleGenerativeAI,
) => {
  const commandText = ctx.message.text
    .replace(/^\/(?:p|ingreso)\s*/i, '')
    .trim();

  if (!commandText) {
    await ctx.reply('❗️ Debes incluir información del paciente después del comando.');
    return;
  }

  const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = buildPatientPrompt(commandText);
  const result = await model.generateContent(prompt);
  const parsed = parseGeminiPatientDraft(result.response.text());

  const id = randomUUID();
  const draft: PatientDraft = {
    id,
    type: 'patient_draft',
    content: parsed,
    createdAt: Date.now(),
    source: 'telegram',
    telegramUser: buildTelegramUser(ctx),
  };

  const filename = `patient_draft_${id}_${draft.createdAt}.json`;
  await saveJsonToDrive(drive, folderId, filename, 'patient_draft', draft);

  const shortId = id.split('-')[0];
  await ctx.reply(
    `✅ Borrador creado para: ${parsed.name}\nDiagnóstico: ${parsed.diagnosis}\nID: ${shortId}`,
  );
};

const handleTextNote = async (
  ctx: NarrowedContext<Context<Update>, Context<Update> & { message: Message.TextMessage }>,
  drive: ReturnType<typeof google.drive>,
  folderId: string,
) => {
  const messageText = extractTextFromMessage(ctx.message);
  const id = randomUUID();
  const note: ChatMessage = {
    id,
    type: 'chat_message',
    content: messageText,
    createdAt: Date.now(),
    source: 'telegram',
    telegramUser: buildTelegramUser(ctx),
  };

  const filename = `note_${id}_${note.createdAt}.json`;
  await saveJsonToDrive(drive, folderId, filename, 'note', note);
  await ctx.reply('📝 Nota guardada');
};

const handleDocument = async (
  ctx: NarrowedContext<Context<Update>, Context<Update> & { message: Message.DocumentMessage }>,
  drive: ReturnType<typeof google.drive>,
  folderId: string,
) => {
  const document = ctx.message.document;
  const fileId = document.file_id;
  const link = await ctx.telegram.getFileLink(fileId);
  const filename = document.file_name ?? `document_${Date.now()}`;

  await streamFileToDrive(drive, folderId, link.toString(), filename, 'unclassified_item', {
    source: 'telegram',
    originalName: filename,
  });

  await ctx.reply(`📎 Archivo guardado: ${filename}`);
};

const handlePhoto = async (
  ctx: NarrowedContext<Context<Update>, Context<Update> & { message: Message.PhotoMessage }>,
  drive: ReturnType<typeof google.drive>,
  folderId: string,
) => {
  const photos = ctx.message.photo;
  const highestQuality = photos[photos.length - 1];
  const fileId = highestQuality.file_id;
  const link = await ctx.telegram.getFileLink(fileId);
  const filename = `photo_${highestQuality.file_unique_id || createHash('sha1').update(fileId).digest('hex').slice(0, 8)}.jpg`;

  await streamFileToDrive(drive, folderId, link.toString(), filename, 'unclassified_item', {
    source: 'telegram',
    originalName: filename,
  });

  await ctx.reply(`📎 Archivo guardado: ${filename}`);
};

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
      };
    }

    const env = parseEnv();
    const drive = createDriveClient(env.serviceAccountJson);
    const gemini = createGeminiClient(env.geminiApiKey);
    const bot = new Telegraf(env.telegramToken);
    bot.webhookReply = false;

    bot.command(PATIENT_COMMANDS, async (ctx) => {
      try {
        if (!('text' in ctx.message)) {
          await ctx.reply('❗️ Debes enviar texto para el comando de ingreso.');
          return;
        }
        await handlePatientDraft(ctx as NarrowedContext<Context<Update>, Context<Update> & { message: Message.TextMessage }>, drive, env.driveFolderId, gemini);
      } catch (error) {
        console.error('Error processing patient draft', error);
        await ctx.reply('⚠️ Ocurrió un error al crear el borrador. Intenta nuevamente.');
      }
    });

    bot.on('document', async (ctx) => {
      try {
        await handleDocument(ctx as NarrowedContext<Context<Update>, Context<Update> & { message: Message.DocumentMessage }>, drive, env.driveFolderId);
      } catch (error) {
        console.error('Error saving document', error);
        await ctx.reply('⚠️ No se pudo guardar el archivo.');
      }
    });

    bot.on('photo', async (ctx) => {
      try {
        await handlePhoto(ctx as NarrowedContext<Context<Update>, Context<Update> & { message: Message.PhotoMessage }>, drive, env.driveFolderId);
      } catch (error) {
        console.error('Error saving photo', error);
        await ctx.reply('⚠️ No se pudo guardar la foto.');
      }
    });

    bot.on('text', async (ctx) => {
      const command = ctx.message.text?.trim().split(' ')[0]?.replace('/', '').toLowerCase();
      if (command && PATIENT_COMMANDS.includes(command)) return;
      try {
        await handleTextNote(ctx as NarrowedContext<Context<Update>, Context<Update> & { message: Message.TextMessage }>, drive, env.driveFolderId);
      } catch (error) {
        console.error('Error saving chat note', error);
        await ctx.reply('⚠️ No se pudo guardar la nota.');
      }
    });

    const payloadString = event.isBase64Encoded
      ? Buffer.from(event.body ?? '', 'base64').toString('utf-8')
      : event.body ?? '{}';
    const update = JSON.parse(payloadString) as Update;

    await bot.handleUpdate(update);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error('Telegram bot handler error', error);
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: false, error: 'Internal error' }),
    };
  }
};

export default handler;

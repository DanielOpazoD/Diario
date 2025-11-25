import { Telegraf } from 'telegraf';
import { GoogleGenerativeAI } from '@google/genai';
import { google } from 'googleapis';
import { Readable } from 'node:stream';

type Handler = (event: { httpMethod: string; body?: string | null }) => Promise<{
  statusCode: number;
  body: string;
}>;

type GeminiClassification = {
  messageType: 'patient_draft' | 'simple_note';
  patient?: {
    fullName?: string;
    nationalId?: string;
    diagnosis?: string;
    symptoms?: string[];
    treatmentPlan?: string[];
  };
  noteSummary?: string;
  actionItems?: string[];
  confidence?: number;
};

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const DRIVE_FOLDER_ID = process.env.DRIVE_INBOX_FOLDER_ID ?? '';
const SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT ?? '';

const credentials = SERVICE_ACCOUNT ? JSON.parse(SERVICE_ACCOUNT) : undefined;
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

let bot: Telegraf | null = null;
let botReady = false;

const ensureBot = () => {
  if (botReady) return;
  bot = new Telegraf(TELEGRAM_TOKEN, {
    telegram: { webhookReply: true },
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message?.text ?? '';
    try {
      const gemini = await classifyText(text);
      const payload = {
        source: 'telegram',
        messageId: ctx.message?.message_id,
        chatId: ctx.chat?.id,
        sender: {
          id: ctx.from?.id,
          username: ctx.from?.username,
          name: [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ').trim() || undefined,
        },
        receivedAt: new Date().toISOString(),
        text,
        gemini,
      };

      const filename = `text-${ctx.message?.message_id ?? Date.now()}.json`;
      await uploadJsonToDrive(payload, filename);
      await ctx.reply('📥 Nota procesada y guardada en Google Drive.');
    } catch (error) {
      console.error('Text handler error', error);
      await ctx.reply('⚠️ No pude procesar tu mensaje ahora. Inténtalo más tarde.');
    }
  });

  bot.on(['photo', 'document'], async (ctx) => {
    try {
      const fileId = extractFileId(ctx.update);
      const fileName = extractFileName(ctx.update);
      if (!fileId || !fileName) {
        await ctx.reply('⚠️ No pude leer el archivo.');
        return;
      }

      await uploadTelegramFileToDrive(ctx, fileId, fileName);
      await ctx.reply('📂 Archivo guardado en Google Drive.');
    } catch (error) {
      console.error('File handler error', error);
      await ctx.reply('⚠️ No pude subir tu archivo. Inténtalo más tarde.');
    }
  });

  botReady = true;
};

const classifyText = async (text: string): Promise<GeminiClassification> => {
  const prompt = `Analiza el siguiente mensaje de Telegram y clasifícalo como "patient_draft" si contiene datos clínicos\n` +
    `o identificables (nombre, RUT, diagnóstico, síntomas, medicación), o como "simple_note" si es una nota general.\n` +
    `Devuelve únicamente un JSON con este esquema:\n` +
    `{"messageType":"patient_draft"|"simple_note","patient":{"fullName?":string,"nationalId?":string,` +
    `"diagnosis?":string,"symptoms?":string[],"treatmentPlan?":string[]},` +
    `"noteSummary?":string,"actionItems?":string[],"confidence?":number}.`;

  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nMensaje:\n${text}` }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  const raw = result.response?.text();
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed as GeminiClassification;
  } catch (error) {
    console.error('Gemini parse error', error);
    return {
      messageType: 'simple_note',
      noteSummary: text,
      confidence: 0,
    };
  }
};

const uploadJsonToDrive = async (data: unknown, filename: string) => {
  const body = Readable.from(Buffer.from(JSON.stringify(data, null, 2)));

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: 'application/json',
      body,
    },
    fields: 'id',
  });
};

const uploadTelegramFileToDrive = async (ctx: Telegraf['context'], fileId: string, filename: string) => {
  if (!bot) throw new Error('Bot not initialized');
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const response = await fetch(fileLink.href);
  if (!response.ok || !response.body) {
    throw new Error(`Unable to download file: ${response.statusText}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
  const body = Readable.fromWeb(response.body as unknown as ReadableStream);

  await drive.files.create({
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
    },
    media: {
      mimeType,
      body,
    },
    fields: 'id',
  });
};

const extractFileId = (update: any): string | undefined => {
  if (update.message?.document?.file_id) return update.message.document.file_id;
  const photos = update.message?.photo;
  if (Array.isArray(photos) && photos.length > 0) {
    return photos[photos.length - 1].file_id;
  }
  return undefined;
};

const extractFileName = (update: any): string | undefined => {
  if (update.message?.document?.file_name) return update.message.document.file_name;
  if (update.message?.photo) {
    const id = extractFileId(update);
    if (id) return `photo-${id}.jpg`;
  }
  return undefined;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'Telegram bot ready' };
  }

  if (!TELEGRAM_TOKEN || !GEMINI_API_KEY || !DRIVE_FOLDER_ID || !SERVICE_ACCOUNT) {
    console.error('Missing environment variables');
    return { statusCode: 500, body: 'Configuration error' };
  }

  ensureBot();

  if (!event.body) {
    return { statusCode: 400, body: 'No payload' };
  }

  const update = JSON.parse(event.body);
  if (!bot) {
    return { statusCode: 500, body: 'Bot unavailable' };
  }

  await bot.handleUpdate(update);
  return { statusCode: 200, body: 'OK' };
};

export default handler;

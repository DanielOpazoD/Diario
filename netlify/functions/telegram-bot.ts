import type { Handler, HandlerEvent } from '@netlify/functions';
import { Telegraf, Context } from 'telegraf';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Readable } from 'node:stream';

const token = process.env.TELEGRAM_BOT_TOKEN;

const resolveGeminiApiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.VITE_API_KEY;

const geminiApiKey = resolveGeminiApiKey();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

// Validación básica
if (!clientId || !clientSecret || !refreshToken) {
  console.warn('Faltan credenciales OAuth de Google (ID, Secret o Refresh Token).');
}

// Configurar cliente OAuth2
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
if (refreshToken) {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
}

// Inicializar Drive con el cliente OAuth
const drive = google.drive({ version: 'v3', auth: oauth2Client });

const INBOX_FOLDER_NAME = 'MediDiario_Inbox';

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is not set; Telegram bot updates will fail.');
}

if (!geminiApiKey) {
  console.warn('GEMINI_API_KEY is not set; Gemini calls will be skipped.');
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const bot = token ? new Telegraf(token) : null;
let handlersRegistered = false;
let cachedInboxFolderId: string | null = null;

const ensureInboxFolder = async (): Promise<string> => {
  if (process.env.GOOGLE_DRIVE_INBOX_ID) return process.env.GOOGLE_DRIVE_INBOX_ID;

  // Si no hay ID, intentar buscar o crear (ahora sí funcionará porque es cuenta de usuario)
  if (cachedInboxFolderId) return cachedInboxFolderId;
  // ... (Mantén tu lógica de búsqueda por nombre INBOX_FOLDER_NAME aquí) ...
  const existing = await drive.files.list({
    q: `name = '${INBOX_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (existing.data.files?.length) {
    cachedInboxFolderId = existing.data.files[0].id ?? null;
    if (cachedInboxFolderId) return cachedInboxFolderId;
  }

  const created = await drive.files.create({
    requestBody: {
      name: INBOX_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  cachedInboxFolderId = created.data.id ?? null;
  if (!cachedInboxFolderId) throw new Error('No se pudo crear la carpeta MediDiario_Inbox en Drive');
  return cachedInboxFolderId;
};

const saveFileToDrive = async (
  filename: string,
  mimeType: string,
  data: string | Buffer,
): Promise<string> => {
  if (!drive) throw new Error('Google Drive no está configurado');
  const folderId = await ensureInboxFolder();
  const stream = typeof data === 'string' ? Readable.from([data]) : Readable.from(data);

  const created = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      mimeType,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id',
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error('No se pudo guardar el archivo en Drive');
  return fileId;
};

const sanitizeFileName = (input: string) => input.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);

const summarizeText = async (text: string): Promise<string> => {
  if (!genAI) return 'Gemini no está configurado.';
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Resume esto en español (máx 6 bullets):\n\n${text}`);
    return result.response.text();
  } catch (e) {
    console.error("Error Gemini:", e);
    return "Error generando resumen.";
  }
};

const describeImage = async (buffer: Buffer, mimeType: string): Promise<string> => {
  if (!genAI) return 'Gemini no está configurado.';
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Analiza esta imagen médica. Resumen breve y hallazgos.",
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType
        }
      }
    ]);
    return result.response.text();
  } catch (e) {
     console.error("Error Gemini Vision:", e);
     return "Error analizando imagen.";
  }
};

const handleTextMessage = async (ctx: Context) => {
  if (!('text' in (ctx.message ?? {}))) return;
  const text = (ctx.message as { text: string }).text;
  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  const author = ctx.from?.username ?? ctx.from?.first_name ?? 'usuario';
  const filename = sanitizeFileName(`${timestamp}_${author}.txt`);

  const summary = await summarizeText(text);
  const payload = `Mensaje original:\n${text}\n\nResumen Gemini:\n${summary}\n`;

  await saveFileToDrive(filename, 'text/plain', payload);
  await ctx.reply('✅ Mensaje guardado en tu MediDiario_Inbox.');
};

const handlePhotoMessage = async (ctx: Context) => {
  const photoSizes = (ctx.message as { photo?: { file_id: string }[] }).photo;
  if (!photoSizes?.length) return;

  const bestPhoto = photoSizes[photoSizes.length - 1];
  const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);
  const response = await fetch(fileLink.href);
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
  const author = ctx.from?.username ?? ctx.from?.first_name ?? 'usuario';
  const baseName = sanitizeFileName(`${timestamp}_${author}`);

  const analysis = await describeImage(buffer, mimeType);

  await saveFileToDrive(`${baseName}.txt`, 'text/plain', `Análisis Gemini:\n${analysis}\n`);
  await saveFileToDrive(`${baseName}.jpg`, mimeType, buffer);
  await ctx.reply('📸 Foto guardada en MediDiario_Inbox con análisis de Gemini.');
};

const setupBotHandlers = () => {
  if (!bot || handlersRegistered) return;
  handlersRegistered = true;

  bot.command('debug', (ctx) => {
    const folderId = process.env.GOOGLE_DRIVE_INBOX_ID;
    const oauthStatus = clientId && clientSecret && refreshToken ? '✅ Detectadas' : '⚠️ Incompletas';
    const geminiStatus = geminiApiKey ? '✅ Detectada' : '⚠️ No configurada';

    ctx.reply(
      `🕵️‍♂️ <b>Diagnóstico de Netlify</b>\n\n` +
        `1. <b>Carpeta Drive (ID):</b> ${folderId ? `✅ Detectada (${folderId.substring(0, 4)}...)` : '⚠️ No configurada (se usa MediDiario_Inbox)'}` +
        `\n2. <b>OAuth Google:</b> ${oauthStatus}` +
        `\n3. <b>Clave Gemini:</b> ${geminiStatus}\n\n` +
        `<i>Si ves una ❌, ve a Netlify > Site Settings > Environment Variables y corrígelo.</i>`,
      { parse_mode: 'HTML' },
    );
  });

  bot.on('text', async (ctx) => {
    try {
      await handleTextMessage(ctx);
    } catch (error) {
      console.error('Error procesando texto', error);
      await ctx.reply('❌ No pude guardar el texto. Revisa las credenciales de Drive/Gemini.');
    }
  });

  bot.on('photo', async (ctx) => {
    try {
      await handlePhotoMessage(ctx);
    } catch (error) {
      console.error('Error procesando foto', error);
      await ctx.reply('❌ No pude guardar la foto. Revisa las credenciales de Drive/Gemini.');
    }
  });

  bot.on('message', async (ctx) => {
    if ('text' in (ctx.message ?? {}) || 'photo' in (ctx.message ?? {})) return;
    await ctx.reply('Envíame texto o fotos y los guardaré en tu MediDiario_Inbox.');
  });
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (!token) {
    return { statusCode: 500, body: 'TELEGRAM_BOT_TOKEN no configurado' };
  }

  if (!event.body) {
    return { statusCode: 400, body: 'Falta el cuerpo de la petición' };
  }

  setupBotHandlers();

  try {
    const update = JSON.parse(event.body);
    await bot?.handleUpdate(update);
    return { statusCode: 200, body: 'ok' };
  } catch (error) {
    console.error('Error handling Telegram update', error);
    return { statusCode: 500, body: 'Error handling Telegram update' };
  }
};

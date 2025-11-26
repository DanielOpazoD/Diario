import type { Handler, HandlerEvent } from '@netlify/functions';
import { Telegraf, Context } from 'telegraf';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import { Readable } from 'node:stream';

const token = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

let serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
let serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

if ((!serviceAccountEmail || !serviceAccountKey) && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    serviceAccountEmail = serviceAccountEmail || credentials.client_email;
    serviceAccountKey = serviceAccountKey || credentials.private_key;
  } catch (e) {
    console.error('Error al parsear GOOGLE_SERVICE_ACCOUNT_JSON:', e);
  }
}

if (serviceAccountKey) {
  serviceAccountKey = serviceAccountKey.replace(/\\n/g, '\n');
}

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is not set; Telegram bot updates will fail.');
}

if (!geminiApiKey) {
  console.warn('GEMINI_API_KEY is not set; Gemini calls will be skipped.');
}

if (!serviceAccountEmail || !serviceAccountKey) {
  console.warn('Google Drive credentials are not set; Drive uploads will be skipped.');
}

const INBOX_FOLDER_NAME = 'MediDiario_Inbox';

const driveAuth = serviceAccountEmail && serviceAccountKey
  ? new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: serviceAccountKey,
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })
  : null;

const drive = driveAuth ? google.drive({ version: 'v3', auth: driveAuth }) : null;

const genAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const bot = token ? new Telegraf(token) : null;
let handlersRegistered = false;
let cachedInboxFolderId: string | null = null;

const ensureInboxFolder = async (): Promise<string> => {
  if (!drive) throw new Error('Google Drive no está configurado');
  if (cachedInboxFolderId) return cachedInboxFolderId;

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
  if (!genAI) return 'Gemini no está configurado para resumir texto.';

  const prompt = `Eres un asistente para registros clínicos personales. Resume en español el siguiente mensaje en máximo 6 viñetas con hallazgos y próximos pasos:\n\n"""${text}"""`;

  const result = await genAI.models.generateContent({
    model: 'gemini-1.5-flash-001',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const summary = result.text;
  return summary?.trim() || 'Gemini no devolvió texto.';
};

const describeImage = async (buffer: Buffer, mimeType: string): Promise<string> => {
  if (!genAI) return 'Gemini no está configurado para análisis de imágenes.';

  const prompt =
    'Analiza la imagen adjunta y devuelve en español un resumen breve y los hallazgos médicos relevantes. Añade posibles próximos pasos.';

  const result = await genAI.models.generateContent({
    model: 'gemini-1.5-flash-001',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: buffer.toString('base64') } },
        ],
      },
    ],
  });

  const description = result.text;
  return description?.trim() || 'Gemini no devolvió texto para la imagen.';
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
    const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    let jsonStatus = '❌ FALTA';
    if (saJson) {
      try {
        JSON.parse(saJson);
        jsonStatus = '✅ OK (Válido)';
      } catch (error) {
        jsonStatus = '⚠️ ERROR DE FORMATO (El JSON está roto)';
      }
    }

    const emailStatus = serviceAccountEmail
      ? `✅ Detectado (${serviceAccountEmail})`
      : '❌ FALTA';

    const keyStatus = serviceAccountKey ? '✅ Detectada' : '❌ FALTA';
    const geminiStatus = geminiApiKey ? '✅ Detectada' : '⚠️ No configurada';

    ctx.reply(
      `🕵️‍♂️ <b>Diagnóstico de Netlify</b>\n\n` +
        `1. <b>Carpeta Drive (ID):</b> ${folderId ? `✅ Detectada (${folderId.substring(0, 4)}...)` : '⚠️ No configurada (se usa MediDiario_Inbox)'}` +
        `\n2. <b>Credencial Google (JSON):</b> ${jsonStatus}` +
        `\n3. <b>Correo de servicio:</b> ${emailStatus}` +
        `\n4. <b>Llave privada:</b> ${keyStatus}` +
        `\n5. <b>Clave Gemini:</b> ${geminiStatus}` +
        `\n   - Largo del JSON: ${saJson ? saJson.length : 0} caracteres\n\n` +
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

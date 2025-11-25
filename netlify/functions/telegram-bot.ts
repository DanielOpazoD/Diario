import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { Readable } from 'node:stream';
import { Telegraf, type Context } from 'telegraf';

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const driveFolderId = process.env.GOOGLE_DRIVE_INBOX_ID;
const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

if (!telegramToken) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN environment variable');
}

if (!driveFolderId) {
  throw new Error('Missing GOOGLE_DRIVE_INBOX_ID environment variable');
}

if (!serviceAccount) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(serviceAccount),
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });
const bot = new Telegraf(telegramToken);

bot.catch((error, ctx) => {
  console.error('Bot error', { error, update: ctx.update });
});

bot.on('text', async (ctx) => {
  try {
    const message = ctx.message.text ?? '';
    const payload = {
      chatId: ctx.chat?.id,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      date: ctx.message.date,
      messageId: ctx.message.message_id,
      text: message,
    };

    const name = `message-${ctx.message.message_id}-${Date.now()}.json`;
    const body = Readable.from(JSON.stringify(payload, null, 2));

    await uploadToDrive(name, 'application/json', body);
    await ctx.reply('Mensaje guardado en Drive ✅');
  } catch (error) {
    console.error('Failed to handle text message', error);
    await ctx.reply('No pudimos guardar tu mensaje. Intenta de nuevo.');
  }
});

bot.on('photo', async (ctx) => {
  const photoSizes = ctx.message.photo;
  const largest = photoSizes[photoSizes.length - 1];
  const filename = `photo-${ctx.message.message_id}-${Date.now()}.jpg`;

  await handleFileUpload(ctx, largest.file_id, filename);
});

bot.on('document', async (ctx) => {
  const document = ctx.message.document;
  const filename =
    document.file_name || `document-${ctx.message.message_id}-${Date.now()}`;

  await handleFileUpload(ctx, document.file_id, filename);
});

async function handleFileUpload(ctx: Context, fileId: string, fileName: string) {
  try {
    const { stream, mimeType } = await downloadTelegramFile(fileId);
    await uploadToDrive(fileName, mimeType, stream);
    await ctx.reply('Archivo enviado a Drive ✅');
  } catch (error) {
    console.error('Failed to upload file', error);
    await ctx.reply('No pudimos guardar tu archivo. Intenta de nuevo.');
  }
}

async function downloadTelegramFile(fileId: string) {
  const file = await bot.telegram.getFile(fileId);

  if (!file.file_path) {
    throw new Error('No file path returned by Telegram');
  }

  const fileUrl = `https://api.telegram.org/file/bot${telegramToken}/${file.file_path}`;
  const response = await fetch(fileUrl);

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
  const stream = Readable.fromWeb(response.body as unknown as ReadableStream);

  return { stream, mimeType };
}

async function uploadToDrive(name: string, mimeType: string, body: NodeJS.ReadableStream) {
  await drive.files.create({
    requestBody: {
      name,
      parents: [driveFolderId],
    },
    media: {
      mimeType,
      body,
    },
    fields: 'id',
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 200,
      body: 'OK',
    };
  }

  try {
    const update = event.body ? JSON.parse(event.body) : undefined;

    if (!update) {
      return { statusCode: 400, body: 'No update payload' };
    }

    await bot.handleUpdate(update);

    return {
      statusCode: 200,
      body: 'Processed',
    };
  } catch (error) {
    console.error('Handler failed', error);

    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};

import type { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import { Telegraf } from 'telegraf';

// --- CONFIGURACIÓN ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DRIVE_INBOX_ID = process.env.GOOGLE_DRIVE_INBOX_ID;
const SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

// Inicializar Servicios (Manejo seguro de errores si faltan vars)
const bot = new Telegraf(BOT_TOKEN || '');
const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY || '' });

// Autenticación Google Drive
const getDriveClient = () => {
  if (!SERVICE_ACCOUNT) return null;
  try {
    const credentials = JSON.parse(SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
  } catch (e) {
    console.error('Error auth Google:', e);
    return null;
  }
};

// --- LÓGICA DEL BOT ---

// 1. Comando de Inicio
bot.start((ctx) => {
  ctx.reply('Hola Dr. 👋 Soy tu asistente de MediDiario. Envíame textos o fotos y los guardaré en tu Drive.');
});

// 2. Manejo de TEXTO
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return; // Ignorar comandos

  const drive = getDriveClient();
  if (!drive || !DRIVE_INBOX_ID) {
    return ctx.reply('❌ Error de configuración del servidor (Drive).');
  }

  try {
    const msg = await ctx.reply('🤔 Procesando...');

    // Analizar con Gemini
    let contentData: { type: 'note' | 'patient_draft'; data: Record<string, unknown> } = {
      type: 'note',
      data: { content: text },
    };
    let description: 'note' | 'patient_draft' = 'note';

    try {
      const prompt = `
        Analiza este texto médico. 
        Si parece un paciente (datos clínicos, rut, diagnostico), responde JSON: {"isPatient": true, "data": {"name": "...", "rut": "...", "diagnosis": "..."}}
        Si es nota general, responde JSON: {"isPatient": false}
        Texto: "${text}"
      `;

      const aiResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
      });

      const jsonStr = aiResponse.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (parsed.isPatient) {
        contentData = { type: 'patient_draft', data: parsed.data };
        description = 'patient_draft';
      }
    } catch (e) {
      console.log('Gemini falló o no es paciente, guardando como nota simple.');
    }

    // Guardar en Drive
    const timestamp = Date.now();
    const fileMetadata = {
      name: `${description}_${timestamp}.json`,
      parents: [DRIVE_INBOX_ID],
      mimeType: 'application/json',
      description,
    };

    const finalFile = {
      id: randomUUID(),
      ...contentData,
      createdAt: timestamp,
      source: 'telegram',
    };

    const media = {
      mimeType: 'application/json',
      body: Readable.from(JSON.stringify(finalFile, null, 2)),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media,
    });

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      undefined,
      description === 'patient_draft' ? '✅ Borrador de paciente guardado.' : '📝 Nota guardada.',
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Error al guardar.');
  }
});

// 3. Manejo de FOTOS y ARCHIVOS
bot.on(['photo', 'document'], async (ctx) => {
  const drive = getDriveClient();
  if (!drive || !DRIVE_INBOX_ID) return ctx.reply('❌ Error config Drive.');

  try {
    const msg = await ctx.reply('⬇️ Descargando...');

    // Obtener link del archivo más grande
    const fileId = 'document' in ctx.message
      ? ctx.message.document.file_id
      : ctx.message.photo[ctx.message.photo.length - 1].file_id;

    const fileLink = await ctx.telegram.getFileLink(fileId);

    // Descargar stream
    const response = await fetch(fileLink.href);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    // Nombre archivo
    let fileName = 'document' in ctx.message ? ctx.message.document.file_name : `foto_${Date.now()}.jpg`;
    if (!fileName) fileName = `archivo_${Date.now()}`;

    // Subir a Drive
    await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [DRIVE_INBOX_ID],
        description: 'unclassified_item',
      },
      media: {
        mimeType: 'application/octet-stream',
        body: stream,
      },
    });

    await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, undefined, '📎 Archivo guardado en Drive.');
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Error subiendo archivo.');
  }
});

// --- HANDLER NETLIFY ---
export const handler: Handler = async (event) => {
  // Solo aceptar POST (Telegram Updates)
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'Bot activo. Envia POST desde Telegram.' };
  }

  try {
    if (!event.body) throw new Error('No body');
    const body = JSON.parse(event.body);
    await bot.handleUpdate(body);
    return { statusCode: 200, body: 'OK' };
  } catch (e) {
    console.error('Error en handler:', e);
    return { statusCode: 500, body: 'Error' };
  }
};

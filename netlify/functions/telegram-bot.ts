import { createSign } from 'crypto';
import { Readable } from 'stream';

interface TelegramFile {
  file_id: string;
  file_size?: number;
  file_path?: string;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  photo?: TelegramFile[];
  document?: TelegramFile & { file_name?: string; mime_type?: string };
  chat: { id: number; type: string; title?: string; username?: string; first_name?: string; last_name?: string };
  from?: { id: number; is_bot: boolean; first_name?: string; last_name?: string; username?: string };
  date: number;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

let cachedToken: { token: string; expiresAt: number } | null = null;

const base64UrlEncode = (input: string | Buffer) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const buildJwt = (credentials: ServiceAccountCredentials, scope: string) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: credentials.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureBase = `${encodedHeader}.${encodedClaimSet}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signatureBase);
  const signature = signer.sign(credentials.private_key);
  const encodedSignature = base64UrlEncode(signature);

  return `${signatureBase}.${encodedSignature}`;
};

const getAccessToken = async (credentials: ServiceAccountCredentials) => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.token;
  }

  const assertion = buildJwt(credentials, 'https://www.googleapis.com/auth/drive.file');
  const params = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain access token: ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
};

const toNodeStream = (stream: ReadableStream<Uint8Array>) =>
  typeof Readable.fromWeb === 'function'
    ? Readable.fromWeb(stream)
    : Readable.from(
        (async function* () {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) yield value;
          }
        })(),
      );

const uploadToDrive = async (
  fileStream: Readable,
  metadata: { name: string; parents: string[] },
  mimeType: string,
  credentials: ServiceAccountCredentials,
) => {
  const boundary = `----diario-${Date.now().toString(16)}`;
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    'utf-8',
  );
  const closing = Buffer.from(`\r\n--${boundary}--`);

  const multipartStream = Readable.from(
    (async function* () {
      yield preamble;
      for await (const chunk of fileStream) {
        yield chunk;
      }
      yield closing;
    })(),
  );

  const token = await getAccessToken(credentials);
  const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartStream as any,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Drive upload failed: ${errorText}`);
  }
};

const getTelegramFileInfo = async (fileId: string, botToken: string) => {
  const res = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getFile?file_id=${fileId}`);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Unable to retrieve file info: ${errorText}`);
  }

  const data = (await res.json()) as { ok: boolean; result?: TelegramFile };
  if (!data.ok || !data.result?.file_path) {
    throw new Error('Invalid response from Telegram getFile');
  }

  return data.result;
};

const downloadTelegramFile = async (
  fileId: string,
  botToken: string,
  fallbackName: string,
): Promise<{ stream: Readable; mimeType: string; fileName: string }> => {
  const fileInfo = await getTelegramFileInfo(fileId, botToken);
  const fileUrl = `${TELEGRAM_API_BASE}/file/bot${botToken}/${fileInfo.file_path}`;
  const response = await fetch(fileUrl);

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    throw new Error(`Failed to download file: ${errorText}`);
  }

  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream';
  const stream = toNodeStream(response.body);
  const fileName = fileInfo.file_path?.split('/').pop() || fallbackName;

  return { stream, mimeType, fileName };
};

const findLargestPhoto = (photos: TelegramFile[]) =>
  photos.reduce((largest, current) => {
    if (!largest) return current;
    const largestSize = largest.file_size ?? 0;
    const currentSize = current.file_size ?? 0;
    return currentSize > largestSize ? current : largest;
  });

export default async function handler(event: { httpMethod: string; body?: string }) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_INBOX_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!botToken || !folderId || !serviceAccountJson) {
    return { statusCode: 500, body: 'Missing required environment variables' };
  }

  let update: TelegramUpdate;
  try {
    update = JSON.parse(event.body || '{}');
  } catch (error) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const message = update.message;
  if (!message) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const credentials = JSON.parse(serviceAccountJson) as ServiceAccountCredentials;
  const metadataBase = { parents: [folderId] };

  try {
    if (message.text) {
      const content = {
        update_id: update.update_id,
        chat: message.chat,
        from: message.from,
        date: message.date,
        text: message.text,
      };
      const fileName = `mensaje-${message.chat.id}-${message.message_id}.json`;
      const stream = Readable.from([Buffer.from(JSON.stringify(content, null, 2), 'utf-8')]);
      await uploadToDrive(stream, { ...metadataBase, name: fileName }, 'application/json', credentials);
    } else if (message.photo?.length) {
      const target = findLargestPhoto(message.photo);
      const fallbackName = `foto-${message.chat.id}-${message.message_id}.jpg`;
      const { stream, mimeType, fileName } = await downloadTelegramFile(target.file_id, botToken, fallbackName);
      await uploadToDrive(stream, { ...metadataBase, name: fileName }, mimeType, credentials);
    } else if (message.document) {
      const doc = message.document;
      const fallbackName = doc.file_name || `documento-${message.chat.id}-${message.message_id}`;
      const { stream, mimeType, fileName } = await downloadTelegramFile(doc.file_id, botToken, fallbackName);
      await uploadToDrive(stream, { ...metadataBase, name: fileName }, doc.mime_type || mimeType, credentials);
    }
  } catch (error) {
    console.error('Telegram bot error:', error);
    return { statusCode: 500, body: 'Error processing message' };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}

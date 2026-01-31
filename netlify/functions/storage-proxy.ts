import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    const url = event.queryStringParameters?.url;
    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing url' }) };
    }

    const response = await fetch(url);
    if (!response.ok) {
      return { statusCode: response.status, body: JSON.stringify({ error: 'Failed to fetch file' }) };
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mimeType: contentType,
        base64: buffer.toString('base64'),
      }),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || 'Proxy error' }) };
  }
};

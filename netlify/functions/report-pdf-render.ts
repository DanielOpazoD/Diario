import type { Handler } from '@netlify/functions';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';

type RenderRequest = {
  html?: string;
};

const MAX_HTML_LENGTH = 1_500_000;

const parsePayload = (body: string | null): RenderRequest => {
  if (!body) return {};
  try {
    return JSON.parse(body) as RenderRequest;
  } catch (_) {
    return {};
  }
};

const buildError = (statusCode: number, message: string) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ error: message }),
});

const SERVER_PRINT_PATCH_CSS = `
@page {
  size: letter;
  margin: 0;
}

html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  background: #fff !important;
}

#sheet,
.sheet {
  position: relative !important;
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 10mm 12mm !important;
}

#logoLeft,
#logoRight {
  position: absolute !important;
  top: 4mm !important;
  width: 18mm !important;
  max-width: 18mm !important;
  height: auto !important;
  opacity: 0.6 !important;
  z-index: 2 !important;
  display: block !important;
}

#logoLeft {
  left: 4mm !important;
}

#logoRight {
  right: 4mm !important;
}
`;

const injectServerPrintPatch = (html: string) => {
  const styleTag = `<style id="report-print-server-patch">${SERVER_PRINT_PATCH_CSS}</style>`;
  if (html.includes('</head>')) {
    return html.replace('</head>', `${styleTag}</head>`);
  }
  return `${styleTag}${html}`;
};

const resolveLocalChromePath = (): string | null => {
  const candidates = [
    process.env.CHROME_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ].filter((value): value is string => Boolean(value));

  const found = candidates.find((candidate) => existsSync(candidate));
  return found || null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return buildError(405, 'Method not allowed.');
  }

  const payload = parsePayload(event.body);
  const html = typeof payload.html === 'string' ? payload.html : '';
  if (!html.trim()) {
    return buildError(400, 'Missing html payload.');
  }
  if (html.length > MAX_HTML_LENGTH) {
    return buildError(413, 'HTML payload too large.');
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    const isLinux = process.platform === 'linux';
    const executablePath = isLinux
      ? await chromium.executablePath('/tmp')
      : resolveLocalChromePath();

    if (!executablePath) {
      return buildError(500, 'No Chrome/Chromium executable was found for PDF rendering.');
    }

    const launchArgs = isLinux
      ? chromium.args
      : ['--no-sandbox', '--disable-setuid-sandbox'];

    browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: { width: 1365, height: 1024 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(injectServerPrintPatch(html), { waitUntil: 'networkidle0', timeout: 30_000 });
    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'content-type': 'application/pdf',
        'cache-control': 'no-store',
      },
      body: Buffer.from(pdfBuffer).toString('base64'),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected render error';
    return buildError(500, message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

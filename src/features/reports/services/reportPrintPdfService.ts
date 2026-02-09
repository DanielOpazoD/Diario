import reportStyles from '@features/reports/reportStyles.css?raw';

const REPORT_PDF_RENDER_ENDPOINT = '/.netlify/functions/report-pdf-render';

export type ReportPrintPageSizeOption = 'browser' | 'letter' | 'oficio' | 'legal' | 'a4';

export interface ReportPrintOptions {
  pageSize?: ReportPrintPageSizeOption;
  scale?: number;
}

const escapeHtmlAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const escapeStyleText = (value: string) =>
  value.replace(/<\/style/gi, '<\\/style');

const resolvePageSizeCss = (pageSize: ReportPrintPageSizeOption): string => {
  switch (pageSize) {
    case 'letter':
      return 'letter';
    case 'oficio':
      return '8.5in 13in';
    case 'legal':
      return 'legal';
    case 'a4':
      return 'A4';
    default:
      return 'auto';
  }
};

const normalizePrintOptions = (options?: ReportPrintOptions) => {
  const pageSize: ReportPrintPageSizeOption = options?.pageSize || 'browser';
  const scale = Math.min(1.15, Math.max(0.8, options?.scale || 1));
  return { pageSize, scale };
};

const buildReportPrintPatchCss = (options?: ReportPrintOptions) => {
  const normalized = normalizePrintOptions(options);
  const pageSizeCss = resolvePageSizeCss(normalized.pageSize);

  return `
@media print {
  @page {
    size: ${pageSizeCss};
    margin: 0;
  }

  body.reports-print #sheet,
  body.reports-print .sheet {
    box-sizing: border-box !important;
    width: calc(100% / ${normalized.scale}) !important;
    max-width: calc(100% / ${normalized.scale}) !important;
    margin: 0 auto !important;
    padding: 6mm 12mm 10mm !important;
    transform: scale(${normalized.scale}) !important;
    transform-origin: top center !important;
  }

  body.reports-print #logoLeft,
  body.reports-print #logoRight {
    position: absolute !important;
    top: 1mm !important;
    width: 18mm !important;
    max-width: 18mm !important;
    height: auto !important;
    display: block !important;
    opacity: 0.6 !important;
    z-index: 2 !important;
  }

  body.reports-print #logoLeft {
    left: 1.5mm !important;
  }

  body.reports-print #logoRight {
    right: 1.5mm !important;
  }
}
`;
};

const applyLogoLayoutStyles = (sheetClone: HTMLElement) => {
  sheetClone.style.position = 'relative';

  const leftLogo = sheetClone.querySelector('#logoLeft') as HTMLImageElement | null;
  const rightLogo = sheetClone.querySelector('#logoRight') as HTMLImageElement | null;

  if (leftLogo) {
    leftLogo.style.position = 'absolute';
    leftLogo.style.top = '1mm';
    leftLogo.style.left = '1.5mm';
    leftLogo.style.width = '18mm';
    leftLogo.style.maxWidth = '18mm';
    leftLogo.style.height = 'auto';
    leftLogo.style.opacity = '0.6';
    leftLogo.style.zIndex = '2';
    leftLogo.style.display = 'block';
  }

  if (rightLogo) {
    rightLogo.style.position = 'absolute';
    rightLogo.style.top = '1mm';
    rightLogo.style.right = '1.5mm';
    rightLogo.style.width = '18mm';
    rightLogo.style.maxWidth = '18mm';
    rightLogo.style.height = 'auto';
    rightLogo.style.opacity = '0.6';
    rightLogo.style.zIndex = '2';
    rightLogo.style.display = 'block';
  }
};

const buildReportPrintHtml = (options?: ReportPrintOptions): string | null => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return null;
  }

  const sheet = document.getElementById('sheet');
  if (!sheet) {
    return null;
  }

  const sheetClone = sheet.cloneNode(true) as HTMLElement;
  sheetClone.style.transform = 'none';
  sheetClone.style.setProperty('--sheet-zoom', '1');
  sheetClone.removeAttribute('contenteditable');
  sheetClone.querySelectorAll('[contenteditable]').forEach((node) => {
    node.removeAttribute('contenteditable');
  });
  applyLogoLayoutStyles(sheetClone);

  const baseHref = escapeHtmlAttr(`${window.location.origin}/`);

  return [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<base href="${baseHref}" />`,
    `<style>${escapeStyleText(reportStyles)}</style>`,
    `<style>${escapeStyleText(buildReportPrintPatchCss(options))}</style>`,
    '</head>',
    '<body class="reports-print" data-theme="light">',
    '<div class="clinical-report-root"><div class="wrap"><div class="workspace"><div class="sheet-shell">',
    sheetClone.outerHTML,
    '</div></div></div></div>',
    '</body>',
    '</html>',
  ].join('');
};

const readRenderError = async (response: Response) => {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error || `Render failed (${response.status})`;
  } catch (_) {
    return `Render failed (${response.status})`;
  }
};

export const generatePrintStyledPdfBlob = async (options?: ReportPrintOptions): Promise<Blob | null> => {
  const html = buildReportPrintHtml(options);
  if (!html) {
    return null;
  }

  const response = await fetch(REPORT_PDF_RENDER_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    throw new Error(await readRenderError(response));
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('Render service returned an empty PDF.');
  }
  return blob;
};

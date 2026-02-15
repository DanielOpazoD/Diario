let pdfWorkerConfigured = false;

const loadPdfJs = async () => {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfWorkerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    pdfWorkerConfigured = true;
  }
  return pdfjs;
};

export const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str?: string; transform?: number[] }>;

    let lastY: number | null = null;
    let pageText = '';

    for (const item of items) {
      const str = item.str || '';
      if (!str) continue;

      // transform[5] is the Y coordinate in PDF space
      const y = item.transform?.[5] ?? null;

      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        // Significant Y change = new line
        pageText += '\n';
      } else if (pageText && !pageText.endsWith('\n') && !pageText.endsWith(' ')) {
        pageText += ' ';
      }

      pageText += str;
      if (y !== null) lastY = y;
    }

    fullText += `${pageText}\n`;
  }

  return fullText.trim();
};

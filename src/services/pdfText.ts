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
    const pageText = (textContent.items as Array<{ str?: string }>)
      .map((item) => item.str || '')
      .join(' ');
    fullText += `${pageText}\n`;
  }

  return fullText.trim();
};

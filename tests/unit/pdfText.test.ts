import { describe, expect, it, vi } from 'vitest';

describe('pdfText', () => {
  it('extracts text from pdf pages', async () => {
    const getPage = vi.fn().mockResolvedValue({
      getTextContent: vi.fn().mockResolvedValue({
        items: [{ str: 'Hola' }, { str: 'Mundo' }],
      }),
    });
    const getDocument = vi.fn().mockReturnValue({
      promise: Promise.resolve({ numPages: 1, getPage }),
    });

    vi.doMock('pdfjs-dist', () => ({
      getDocument,
      GlobalWorkerOptions: { workerSrc: '' },
    }));

    const { extractTextFromPdf } = await import('@services/pdfText');
    const text = await extractTextFromPdf(new ArrayBuffer(8));

    expect(getDocument).toHaveBeenCalled();
    expect(getPage).toHaveBeenCalledWith(1);
    expect(text).toContain('Hola Mundo');
  });
});

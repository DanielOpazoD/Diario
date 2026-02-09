import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generatePrintStyledPdfBlob } from '@features/reports/services/reportPrintPdfService';

describe('reportPrintPdfService', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('returns null when report sheet is not present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await generatePrintStyledPdfBlob();

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requests print-style pdf when sheet exists', async () => {
    document.body.innerHTML = '<div id="sheet"><div class="title">Informe</div></div>';
    const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(pdfBlob, { status: 200, headers: { 'content-type': 'application/pdf' } })
    );

    const result = await generatePrintStyledPdfBlob();

    expect(result?.size).toBeGreaterThan(0);
    expect(result?.type).toBe('application/pdf');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/.netlify/functions/report-pdf-render',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('forces logo dimensions in generated print html', async () => {
    document.body.innerHTML = [
      '<div id="sheet">',
      '<img id="logoLeft" src="https://example.com/left.png" />',
      '<img id="logoRight" src="https://example.com/right.png" />',
      '</div>',
    ].join('');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Blob(['pdf'], { type: 'application/pdf' }), { status: 200 })
    );

    await generatePrintStyledPdfBlob();

    const init = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
    const payload = JSON.parse(String(init?.body || '{}')) as { html?: string };

    expect(payload.html).toContain('id="logoLeft"');
    expect(payload.html).toContain('width: 18mm;');
    expect(payload.html).toContain('id="logoRight"');
  });

  it('throws detailed error when render endpoint fails', async () => {
    document.body.innerHTML = '<div id="sheet"><div class="title">Informe</div></div>';
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Render failed' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(generatePrintStyledPdfBlob()).rejects.toThrow('Render failed');
  });
});

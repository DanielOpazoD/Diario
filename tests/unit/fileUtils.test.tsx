import { describe, expect, it } from 'vitest';
import { displayFileName, formatFileDate, formatFileSize, getFileColor, getFileIcon } from '@features/files/fileUtils';

describe('fileUtils', () => {
  it('formats file size', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
  });

  it('formats file date', () => {
    const date = new Date('2026-01-31T00:00:00Z');
    expect(formatFileDate(date.getTime())).toBe(date.toLocaleDateString());
  });

  it('strips date prefix from file name', () => {
    expect(displayFileName('2026-01-31_report.pdf')).toBe('report.pdf');
    expect(displayFileName('report.pdf')).toBe('report.pdf');
  });

  it('returns file color by mime type', () => {
    expect(getFileColor('image/png')).toContain('purple');
    expect(getFileColor('application/pdf')).toContain('red');
    expect(getFileColor('application/msword')).toContain('blue');
    expect(getFileColor('text/plain')).toContain('gray');
  });

  it('returns file icon by mime type', () => {
    const imageIcon = getFileIcon('image/png') as any;
    const pdfIcon = getFileIcon('application/pdf') as any;
    const otherIcon = getFileIcon('text/plain') as any;
    expect(imageIcon.props.className).toContain('text-purple-500');
    expect(pdfIcon.props.className).toContain('text-red-500');
    expect(otherIcon.props.className).toContain('text-gray-500');
  });
});

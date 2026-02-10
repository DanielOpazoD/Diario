import { describe, expect, it, vi } from 'vitest';
import {
  executeRichTextToolbarCommand,
  getNextSheetZoom,
  isZoomToolbarCommand,
} from '@features/reports/services/reportToolbarService';

describe('reportToolbarService', () => {
  it('identifies zoom commands', () => {
    expect(isZoomToolbarCommand('zoom-in')).toBe(true);
    expect(isZoomToolbarCommand('zoom-out')).toBe(true);
    expect(isZoomToolbarCommand('bold')).toBe(false);
  });

  it('updates zoom with clamp boundaries', () => {
    expect(getNextSheetZoom(1, 'zoom-in')).toBe(1.05);
    expect(getNextSheetZoom(1.35, 'zoom-in')).toBe(1.35);
    expect(getNextSheetZoom(0.75, 'zoom-out')).toBe(0.75);
    expect(getNextSheetZoom(1, 'zoom-out')).toBe(0.95);
  });

  it('executes rich text command against focused editable node', () => {
    const target = document.createElement('div');
    target.focus = vi.fn();
    const execSpy = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', {
      value: execSpy,
      configurable: true,
      writable: true,
    });

    executeRichTextToolbarCommand('bold', target);

    expect(target.focus).toHaveBeenCalled();
    expect(execSpy).toHaveBeenCalledWith('bold');
  });
});

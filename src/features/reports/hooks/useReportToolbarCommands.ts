import { useCallback, useEffect, useRef, useState } from 'react';
import {
  executeRichTextToolbarCommand,
  getNextSheetZoom,
  isZoomToolbarCommand,
} from '@features/reports/services/reportToolbarService';

export const useReportToolbarCommands = () => {
  const [sheetZoom, setSheetZoom] = useState(1);
  const lastEditableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.classList.contains('note-area')) {
        lastEditableRef.current = target;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  const handleToolbarCommand = useCallback((command: string) => {
    if (isZoomToolbarCommand(command)) {
      setSheetZoom((prev) => getNextSheetZoom(prev, command));
      return;
    }

    executeRichTextToolbarCommand(command, lastEditableRef.current);
  }, []);

  return {
    sheetZoom,
    handleToolbarCommand,
  };
};

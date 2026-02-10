const SHEET_ZOOM_MIN = 0.75;
const SHEET_ZOOM_MAX = 1.35;
const SHEET_ZOOM_STEP = 0.05;

export const isZoomToolbarCommand = (command: string): boolean => (
  command === 'zoom-in' || command === 'zoom-out'
);

export const getNextSheetZoom = (currentZoom: number, command: string): number => {
  if (command === 'zoom-in') {
    return Math.min(SHEET_ZOOM_MAX, Number((currentZoom + SHEET_ZOOM_STEP).toFixed(2)));
  }
  if (command === 'zoom-out') {
    return Math.max(SHEET_ZOOM_MIN, Number((currentZoom - SHEET_ZOOM_STEP).toFixed(2)));
  }
  return currentZoom;
};

export const executeRichTextToolbarCommand = (
  command: string,
  editableTarget: HTMLElement | null
): void => {
  if (typeof document === 'undefined' || !editableTarget) return;
  editableTarget.focus();
  document.execCommand(command);
};

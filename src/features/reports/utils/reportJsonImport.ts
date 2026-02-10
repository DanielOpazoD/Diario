import type { CSSProperties } from 'react';

export const reportLogoStyle: CSSProperties = {
  position: 'absolute',
  top: '0mm',
  width: '18mm',
  maxWidth: '18mm',
  height: 'auto',
  opacity: 0.6,
  zIndex: 2,
  display: 'block',
};

const isJsonAttachment = (fileName: string, mimeType: string): boolean => (
  mimeType === 'application/json' || mimeType === 'text/json' || fileName.toLowerCase().endsWith('.json')
);

export const isCompatibleJsonAttachment = (fileName?: string, mimeType?: string): boolean => {
  const hasName = typeof fileName === 'string' && fileName.trim().length > 0;
  const hasMime = typeof mimeType === 'string' && mimeType.trim().length > 0;
  if (!hasName && !hasMime) return true;
  if (isJsonAttachment(fileName || '', mimeType || '')) return true;
  // Incomplete metadata should not block import/update.
  return !hasName || !hasMime;
};

const buildReportErrorId = (): string => (
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : `report-${Date.now()}`
);

export const emitReportJsonConsoleError = (
  stage: 'import' | 'update' | 'link',
  error: unknown,
  context: Record<string, unknown>
) => {
  const reportId = buildReportErrorId();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const payload = {
    reportId,
    stage,
    timestamp: new Date().toISOString(),
    errorMessage,
    ...context,
  };
  if (typeof console !== 'undefined') {
    console.error('[ClinicalReportJSON]', payload);
  }
  return payload;
};


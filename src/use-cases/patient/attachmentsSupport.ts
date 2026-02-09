import type { AttachedFile } from '@shared/types';

export const isSupportedAttachment = (file: AttachedFile) =>
  file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf';

export const filterSupportedAttachments = (files: AttachedFile[]) =>
  files.filter(isSupportedAttachment);

export const hasDriveUrl = (file: AttachedFile) => Boolean(file.driveUrl);

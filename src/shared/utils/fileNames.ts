export const sanitizeFileName = (value: string) =>
  value
    .trim()
    .replace(/[\s\/_\\]+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

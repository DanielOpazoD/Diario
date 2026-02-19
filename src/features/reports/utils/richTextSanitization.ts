const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'BR',
  'P',
  'DIV',
  'UL',
  'OL',
  'LI',
  'SPAN',
]);

const DROP_TAGS = new Set(['SCRIPT', 'STYLE']);

const sanitizeNode = (node: Node, doc: Document): Node | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as HTMLElement;
  const tagName = element.tagName.toUpperCase();
  const sanitizedChildren: Node[] = [];

  if (DROP_TAGS.has(tagName)) {
    return null;
  }

  element.childNodes.forEach((child) => {
    const sanitized = sanitizeNode(child, doc);
    if (sanitized) sanitizedChildren.push(sanitized);
  });

  if (!ALLOWED_TAGS.has(tagName)) {
    if (sanitizedChildren.length === 0) return null;
    const fragment = doc.createDocumentFragment();
    sanitizedChildren.forEach((child) => fragment.appendChild(child));
    return fragment;
  }

  const cleanElement = doc.createElement(tagName.toLowerCase());
  sanitizedChildren.forEach((child) => cleanElement.appendChild(child));
  return cleanElement;
};

export const sanitizeRichText = (input: string): string => {
  if (!input) return '';
  if (typeof document === 'undefined') return input;

  const container = document.createElement('div');
  container.innerHTML = input;

  const output = document.createElement('div');
  container.childNodes.forEach((node) => {
    const sanitized = sanitizeNode(node, document);
    if (sanitized) output.appendChild(sanitized);
  });

  return output.innerHTML;
};

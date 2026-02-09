import { describe, it, expect } from 'vitest';
import { sanitizeRichText } from '@shared/utils/richTextSanitization';

describe('sanitizeRichText', () => {
  it('removes disallowed tags but preserves text', () => {
    const input = '<div>Hello <a href="javascript:alert(1)">link</a><script>alert(1)</script></div>';
    expect(sanitizeRichText(input)).toBe('<div>Hello link</div>');
  });

  it('strips attributes on allowed tags', () => {
    const input = '<p class="x" style="color:red">Text <strong data-x="1">Bold</strong></p>';
    expect(sanitizeRichText(input)).toBe('<p>Text <strong>Bold</strong></p>');
  });

  it('drops self-closing disallowed nodes', () => {
    const input = '<div>Photo<img src="x" onerror="alert(1)"></div>';
    expect(sanitizeRichText(input)).toBe('<div>Photo</div>');
  });

  it('keeps list structure', () => {
    const input = '<ul><li>One</li><li>Two</li></ul>';
    expect(sanitizeRichText(input)).toBe('<ul><li>One</li><li>Two</li></ul>');
  });
});

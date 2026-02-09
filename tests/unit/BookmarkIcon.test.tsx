import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BookmarkIcon from '@core/ui/BookmarkIcon';

vi.mock('@services/logger', () => ({
  emitStructuredLog: vi.fn(),
}));

describe('BookmarkIcon', () => {
  it('renders custom emoji icon', () => {
    const { container } = render(<BookmarkIcon bookmark={{ url: 'example.com', icon: '⭐' }} />);
    expect(container.textContent).toContain('⭐');
  });

  it('renders custom image and falls back on error', () => {
    const { container, rerender } = render(
      <BookmarkIcon bookmark={{ url: 'example.com', icon: 'http://example.com/icon.png' }} />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    if (img) {
      fireEvent.error(img);
    }
    rerender(<BookmarkIcon bookmark={{ url: 'example.com', icon: 'http://example.com/icon.png' }} />);
    // After error, should fall back to favicon or default
    expect(container.querySelector('img')).toBeTruthy();
  });

  it('renders favicon for url', () => {
    const { container } = render(<BookmarkIcon bookmark={{ url: 'https://example.com' }} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toContain('google.com/s2/favicons');
  });

  it('renders fallback when url is empty', () => {
    const { container } = render(<BookmarkIcon bookmark={{ url: '' }} />);
    expect(container.textContent).toContain('🔖');
  });
});

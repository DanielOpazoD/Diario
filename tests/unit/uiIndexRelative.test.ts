import { describe, expect, it } from 'vitest';
import * as UIIndex from '../../src/core/ui/index';

describe('core/ui index exports (relative)', () => {
  it('exports expected symbols', () => {
    expect(UIIndex).toBeTruthy();
    expect(UIIndex.Button).toBeTruthy();
    expect(UIIndex.Toast).toBeTruthy();
    expect(UIIndex.BookmarkIcon).toBeTruthy();
    expect(UIIndex.ConfirmationModal).toBeTruthy();
    expect(UIIndex.ViewSkeleton).toBeTruthy();
  });
});

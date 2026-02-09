import { describe, expect, it } from 'vitest';
import { Button, Toast, BookmarkIcon, ConfirmationModal, ViewSkeleton } from '@core/ui';

describe('core/ui index exports', () => {
  it('exports expected components', () => {
    expect(Button).toBeTruthy();
    expect(Toast).toBeTruthy();
    expect(BookmarkIcon).toBeTruthy();
    expect(ConfirmationModal).toBeTruthy();
    expect(ViewSkeleton).toBeTruthy();
  });
});

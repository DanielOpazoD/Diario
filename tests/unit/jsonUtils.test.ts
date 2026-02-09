import { describe, expect, it } from 'vitest';
import { safeJsonParse } from '@shared/utils/json';

describe('safeJsonParse', () => {
  it('returns fallback when value is null', () => {
    expect(safeJsonParse(null, { ok: false })).toEqual({ ok: false });
  });

  it('returns fallback when JSON is invalid', () => {
    expect(safeJsonParse('{bad', { ok: false })).toEqual({ ok: false });
  });

  it('parses valid JSON', () => {
    expect(safeJsonParse('{"ok":true}', { ok: false })).toEqual({ ok: true });
  });
});

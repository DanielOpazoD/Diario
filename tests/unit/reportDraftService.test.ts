import { describe, expect, it, vi } from 'vitest';

const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockDoc = vi.fn((..._args: any[]) => ({ path: 'doc-path' }));

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
}));

vi.mock('@services/logger', () => ({
  emitStructuredLog: vi.fn(),
}));

describe('reportDraftService', () => {
  it('returns early when deps missing', async () => {
    vi.resetModules();
    vi.doMock('@services/firebase/firestore', () => ({ getFirestoreInstance: async () => null }));
    vi.doMock('@services/firebase/auth', () => ({ getAuthInstance: async () => null }));

    const { saveReportDraft } = await import('@services/reportDraftService');
    await saveReportDraft('draft-1', { id: 'r1' } as any);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('returns early when user missing', async () => {
    vi.resetModules();
    vi.doMock('@services/firebase/firestore', () => ({ getFirestoreInstance: async () => ({}) }));
    vi.doMock('@services/firebase/auth', () => ({ getAuthInstance: async () => ({ currentUser: null }) }));

    const { saveReportDraft } = await import('@services/reportDraftService');
    await saveReportDraft('draft-2', { id: 'r2' } as any);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('saves report draft when configured', async () => {
    vi.resetModules();
    vi.doMock('@services/firebase/firestore', () => ({ getFirestoreInstance: async () => ({}) }));
    vi.doMock('@services/firebase/auth', () => ({ getAuthInstance: async () => ({ currentUser: { uid: 'u1' } }) }));

    const { saveReportDraft } = await import('@services/reportDraftService');
    await saveReportDraft('draft-3', { id: 'r3', note: undefined } as any);
    expect(mockSetDoc).toHaveBeenCalled();
  });

  it('loads report draft when exists', async () => {
    vi.resetModules();
    vi.doMock('@services/firebase/firestore', () => ({ getFirestoreInstance: async () => ({}) }));
    vi.doMock('@services/firebase/auth', () => ({ getAuthInstance: async () => ({ currentUser: { uid: 'u1' } }) }));
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ record: { id: 'r4' }, updatedAt: 123 }) });

    const { loadReportDraft } = await import('@services/reportDraftService');
    const result = await loadReportDraft('draft-4');
    expect(result).toEqual({ record: { id: 'r4' }, updatedAt: 123 });
  });

  it('returns null for missing doc', async () => {
    vi.resetModules();
    vi.doMock('@services/firebase/firestore', () => ({ getFirestoreInstance: async () => ({}) }));
    vi.doMock('@services/firebase/auth', () => ({ getAuthInstance: async () => ({ currentUser: { uid: 'u1' } }) }));
    mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });

    const { loadReportDraft } = await import('@services/reportDraftService');
    const result = await loadReportDraft('draft-5');
    expect(result).toBeNull();
  });
});

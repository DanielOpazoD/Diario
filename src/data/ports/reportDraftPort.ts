import type { ReportRecord } from '@domain/report/entities';

export interface ReportDraftPort {
  saveDraft: (draftId: string, record: ReportRecord) => Promise<void>;
  loadDraft: (draftId: string) => Promise<{ record: ReportRecord; updatedAt: number } | null>;
}

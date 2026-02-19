// eslint-disable-next-line boundaries/element-types
import type { ReportRecord } from '@features/reports/domain/entities';

export interface ReportDraftPort {
  saveDraft: (draftId: string, record: ReportRecord) => Promise<void>;
  loadDraft: (draftId: string) => Promise<{ record: ReportRecord; updatedAt: number } | null>;
}

import type { ReportDraftPort } from '@data/ports/reportDraftPort';
import { loadReportDraft, saveReportDraft } from '@services/reportDraftService';

export const reportDraftAdapter: ReportDraftPort = {
  saveDraft: saveReportDraft,
  loadDraft: loadReportDraft,
};

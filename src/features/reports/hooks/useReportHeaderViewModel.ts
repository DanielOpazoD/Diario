import { useCallback, useMemo } from 'react';
import type { ReportRecord } from '@domain/report';
import {
  buildReportFileNameBaseFromRecord,
  getReportHeaderContext,
} from '@use-cases/reportPatient';

export const useReportHeaderViewModel = (record: ReportRecord) => {
  const metadata = useMemo(() => getReportHeaderContext(record), [record]);

  const buildDefaultReportFileNameBase = useCallback((patientNameOverride?: string) => (
    buildReportFileNameBaseFromRecord({ record, patientNameOverride })
  ), [record]);

  return {
    ...metadata,
    buildDefaultReportFileNameBase,
  };
};

import { useCallback, useMemo } from 'react';
import type { ReportRecord } from '@features/reports/domain';
import {
  buildReportFileNameBaseFromRecord,
  getReportHeaderContext,
} from '../utils/reportPatient';

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

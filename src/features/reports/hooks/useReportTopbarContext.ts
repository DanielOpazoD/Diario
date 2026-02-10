import { useEffect } from 'react';

type UseReportTopbarContextParams = {
  patientName: string;
  patientRut: string;
  reportDate: string;
  templateName: string;
  setTopbarContextRaw: (value: string) => void;
  clearTopbarContext: () => void;
  emitReportContextChanged: () => void;
};

export const useReportTopbarContext = ({
  patientName,
  patientRut,
  reportDate,
  templateName,
  setTopbarContextRaw,
  clearTopbarContext,
  emitReportContextChanged,
}: UseReportTopbarContextParams) => {
  useEffect(() => {
    const contextPayload = {
      patientName,
      patientRut,
      reportDate,
      templateName,
      updatedAt: Date.now(),
    };
    setTopbarContextRaw(JSON.stringify(contextPayload));
    emitReportContextChanged();
  }, [
    patientName,
    patientRut,
    reportDate,
    templateName,
    setTopbarContextRaw,
    emitReportContextChanged,
  ]);

  useEffect(() => {
    return () => {
      clearTopbarContext();
      emitReportContextChanged();
    };
  }, [clearTopbarContext, emitReportContextChanged]);
};

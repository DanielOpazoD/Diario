import React, { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppActions } from '@core/app/state/useAppActions';
import { safeSessionGetItem, safeSessionRemoveItem, safeSessionSetItem } from '@shared/utils/safeSessionStorage';
import { SESSION_KEYS } from '@shared/constants/sessionKeys';
import { savePatientRecord } from '@use-cases/patient/save';
import {
    downloadPatientFileBlob,
    downloadPatientFileBlobById,
    updatePatientFileById,
    uploadPatientFile,
} from '@use-cases/attachments';
import { useUser, useRecords, usePatientTypes } from '@core/app/state/useAppState';
// eslint-disable-next-line boundaries/element-types
import { MedicalReportViewContent, type ReportHostContext } from '@features/reports';
import { loadDraftReport, saveDraftReport } from '@use-cases/reports';
import { extractLabResultsUseCase } from '@use-cases/patient/extractLabResultsUseCase';
import { calculateAge, normalizeBirthDateInput } from '@shared/utils/dateUtils';
import { sanitizeRichText } from '@shared/utils/richTextSanitization';

export const useAppReportHostContext = (): ReportHostContext => {
    const location = useLocation();
    const user = useUser();
    const records = useRecords();
    const patientTypes = usePatientTypes();
    const appActions = useAppActions();

    const openExternal = useCallback((url: string) => {
        if (typeof window === 'undefined') return;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const emitReportContextChanged = useCallback(() => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('medidiario:report-context'));
    }, []);

    return useMemo(() => ({
        state: {
            user,
            records,
            patientTypes,
        },
        actions: {
            addPatient: appActions.addPatient,
            updatePatient: appActions.updatePatient,
            addToast: appActions.addToast,
        },
        data: {
            savePatientRecord,
            saveDraftReport,
            loadDraftReport,
            extractLabText: extractLabResultsUseCase,
            downloadPatientFileBlob,
            downloadPatientFileBlobById,
            updatePatientFileById,
            uploadPatientFile,
        },
        session: {
            getLinkedJsonRaw: () => safeSessionGetItem(SESSION_KEYS.REPORT_LINKED_JSON),
            setLinkedJsonRaw: (value: string) => safeSessionSetItem(SESSION_KEYS.REPORT_LINKED_JSON, value),
            getTopbarContextRaw: () => safeSessionGetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT),
            setTopbarContextRaw: (value: string) => safeSessionSetItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT, value),
            clearTopbarContext: () => safeSessionRemoveItem(SESSION_KEYS.REPORT_TOPBAR_CONTEXT),
        },
        utils: {
            calculateAge,
            normalizeBirthDateInput,
            sanitizeRichText,
        },
        locationSearch: location.search,
        openExternal,
        emitReportContextChanged,
    }), [
        appActions.addPatient,
        appActions.updatePatient,
        appActions.addToast,
        user,
        records,
        patientTypes,
        location.search,
        openExternal,
        emitReportContextChanged,
    ]);
};

const ReportAppAdapter: React.FC = () => {
    const host = useAppReportHostContext();
    return <MedicalReportViewContent host={host} />;
};

export default ReportAppAdapter;

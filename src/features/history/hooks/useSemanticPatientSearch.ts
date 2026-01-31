import { useCallback, useMemo, useState } from 'react';
import { searchPatientsSemantically } from '@use-cases/ai';
import type { PatientRecord } from '@shared/types';

type UseSemanticPatientSearchOptions = {
  records: PatientRecord[];
  onInfo: (message: string) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export const useSemanticPatientSearch = ({
  records,
  onInfo,
  onSuccess,
  onError,
}: UseSemanticPatientSearchOptions) => {
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[] | null>(null);

  const patientDataForAI = useMemo(
    () =>
      records.map((record) => ({
        id: record.id,
        context: `${record.name} ${record.diagnosis} ${record.clinicalNote} ${record.pendingTasks
          .map((task) => task.text)
          .join(', ')}`,
      })),
    [records]
  );

  const handleSemanticSearch = useCallback(async () => {
    if (!semanticQuery.trim()) {
      setSemanticResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const resultIds = await searchPatientsSemantically(semanticQuery, patientDataForAI);
      setSemanticResults(resultIds);
      if (resultIds.length === 0) {
        onInfo('No se encontraron pacientes para esta consulta.');
      } else {
        onSuccess(`Se encontraron ${resultIds.length} pacientes.`);
      }
    } catch (error: any) {
      onError(`Error en búsqueda IA: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  }, [onError, onInfo, onSuccess, patientDataForAI, semanticQuery]);

  const clearSemanticSearch = useCallback(() => {
    setSemanticQuery('');
    setSemanticResults(null);
    setIsSemanticSearch(false);
  }, []);

  return {
    isSemanticSearch,
    setIsSemanticSearch,
    semanticQuery,
    setSemanticQuery,
    isSearching,
    semanticResults,
    handleSemanticSearch,
    clearSemanticSearch,
  };
};

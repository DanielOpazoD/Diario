import { useQueryClient, useMutation } from '@tanstack/react-query';
import { AttachedFile } from '@shared/types';
import { uploadPatientFile, deletePatientFile } from '@use-cases/attachments';

interface UsePatientFilesOptions {
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  enabled?: boolean;
  onSuccess?: (files: AttachedFile[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook simplified to no-op for Drive fetching as we now rely on Firebase/Firestore integration
 * stored in the patient record.
 */
export function usePatientFiles(_options: UsePatientFilesOptions) {
  // No-op: We strictly use the files passed via props from the PatientRecord
  return {
    files: [],
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: () => { },
    updateCache: () => { },
    getCachedData: () => [],
    hasCachedData: false,
    isFromCache: false,
  };
}

interface UseUploadPatientFileMutationOptions {
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  onSuccess?: (file: AttachedFile) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para subir archivos a Firebase Storage
 */
export function useUploadPatientFileFirebase({
  patientId,
  onSuccess,
  onError,
}: UseUploadPatientFileMutationOptions & { patientId: string }) {

  return useMutation({
    mutationFn: async (file: File) => {
      // Ensure we pass a valid patientId for the path
      return uploadPatientFile(file, patientId);
    },
    onSuccess: (newFile) => {
      // We might want to invalidate queries or update cache if we were using it
      onSuccess?.(newFile);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}

/**
 * Hook para eliminar archivos de Firebase Storage
 */
export function useDeletePatientFileFirebase({
  addToast,
}: {
  addToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, fileName, fileId }: { patientId: string, fileName: string, fileId: string }) =>
      deletePatientFile(patientId, fileName, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientFiles'] });
      addToast('success', 'Archivo eliminado de Firebase');
    },
    onError: (error: Error) => {
      addToast('error', `Error al eliminar de Firebase: ${error.message}`);
    },
  });
}

/**
 * Deprecated hooks kept to prevent breaking imports temporarily, 
 * but they will throw or do nothing relevant for Drive.
 */
export function useUploadPatientFile(options: UseUploadPatientFileMutationOptions) {
  return useUploadPatientFileFirebase({ ...options, patientId: 'deprecated' }); // Should not be used
}

export function useDeletePatientFile(_options: any) {
  return { mutateAsync: async () => { } };
}

export function useCreatePatientFolder(_options: any) {
  return { mutateAsync: async () => { } };
}

export function usePrefetchPatientFiles() {
  return { prefetch: async () => { } };
}

export function useInvalidateAllPatientFiles() {
  const queryClient = useQueryClient();
  const invalidateAll = () => {
    return queryClient.invalidateQueries({
      queryKey: ['patientFiles'],
    });
  };
  return { invalidateAll };
}

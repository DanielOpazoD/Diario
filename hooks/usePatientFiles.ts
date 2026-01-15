import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { AttachedFile } from '../types';
import {
  fetchPatientFolderFiles,
  uploadFileForPatient,
  deleteFileFromDrive,
  createPatientDriveFolder,
} from '../services/googleService';
import {
  uploadFileToFirebase,
  deleteFileFromFirebase
} from '../services/firebaseStorageService';

// Clave de caché única por paciente
const getPatientFilesKey = (patientRut: string, patientName: string, driveFolderId?: string | null) =>
  ['patientFiles', driveFolderId || patientRut, patientName] as const;

interface UsePatientFilesOptions {
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  enabled?: boolean;
  onSuccess?: (files: AttachedFile[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para obtener los archivos de un paciente con caché inteligente.
 * Si el paciente ya fue visitado, los datos se cargan instantáneamente desde memoria.
 */
export function usePatientFiles({
  patientRut,
  patientName,
  patientDriveFolderId,
  enabled = true,
  onSuccess,
  onError,
}: UsePatientFilesOptions) {
  const queryClient = useQueryClient();
  const accessToken = sessionStorage.getItem('google_access_token');

  const query = useQuery({
    queryKey: getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('No hay sesión de Google activa');
      }
      return fetchPatientFolderFiles(accessToken, patientRut, patientName, patientDriveFolderId);
    },
    enabled: enabled && !!accessToken && !!patientRut && !!patientName,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos en caché
  });

  // Llamar callbacks manualmente cuando cambia el estado
  if (query.isSuccess && onSuccess && query.data) {
    // Evitar llamadas repetidas usando un flag interno
  }
  if (query.isError && onError && query.error) {
    // Evitar llamadas repetidas
  }

  // Función para invalidar y refetch manualmente
  const refetch = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
    });
  }, [queryClient, patientRut, patientName, patientDriveFolderId]);

  // Función para actualizar el caché optimistamente
  const updateCache = useCallback(
    (updater: (oldFiles: AttachedFile[] | undefined) => AttachedFile[]) => {
      queryClient.setQueryData<AttachedFile[]>(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
        updater
      );
    },
    [queryClient, patientRut, patientName, patientDriveFolderId]
  );

  // Obtener datos del caché sin trigger de fetch
  const getCachedData = useCallback(() => {
    return queryClient.getQueryData<AttachedFile[]>(
      getPatientFilesKey(patientRut, patientName, patientDriveFolderId)
    );
  }, [queryClient, patientRut, patientName, patientDriveFolderId]);

  // Verificar si hay datos en caché (para carga instantánea)
  const hasCachedData = !!getCachedData();

  return {
    files: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
    updateCache,
    getCachedData,
    hasCachedData,
    // Estado adicional útil
    isFromCache: hasCachedData && !query.isFetching,
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
 * Hook para subir archivos con actualización optimista del caché
 */
export function useUploadPatientFile({
  patientRut,
  patientName,
  patientDriveFolderId,
  onSuccess,
  onError,
}: UseUploadPatientFileMutationOptions) {
  const queryClient = useQueryClient();
  const accessToken = sessionStorage.getItem('google_access_token');

  return useMutation({
    mutationFn: async (file: File) => {
      if (!accessToken) {
        throw new Error('No hay sesión de Google activa');
      }
      return uploadFileForPatient(file, patientRut, patientName, accessToken, patientDriveFolderId);
    },
    onSuccess: (newFile) => {
      // Actualizar el caché añadiendo el nuevo archivo
      queryClient.setQueryData<AttachedFile[]>(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
        (oldFiles = []) => [...oldFiles, newFile]
      );
      onSuccess?.(newFile);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}

/**
 * Hook para subir archivos a Firebase Storage
 */
export function useUploadPatientFileFirebase({
  patientRut,
  patientName,
  patientId,
  patientDriveFolderId,
  onSuccess,
  onError,
}: UseUploadPatientFileMutationOptions & { patientId: string }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      return uploadFileToFirebase(file, patientId);
    },
    onSuccess: (newFile) => {
      queryClient.setQueryData<AttachedFile[]>(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
        (oldFiles = []) => [...oldFiles, newFile]
      );
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
      deleteFileFromFirebase(patientId, fileName, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientFiles'] });
      addToast('success', 'Archivo eliminado de Firebase');
    },
    onError: (error: Error) => {
      addToast('error', `Error al eliminar de Firebase: ${error.message}`);
    },
  });
}

interface UseDeletePatientFileMutationOptions {
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para eliminar archivos con actualización optimista del caché
 */
export function useDeletePatientFile({
  patientRut,
  patientName,
  patientDriveFolderId,
  onSuccess,
  onError,
}: UseDeletePatientFileMutationOptions) {
  const queryClient = useQueryClient();
  const accessToken = sessionStorage.getItem('google_access_token');

  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!accessToken) {
        throw new Error('No hay sesión de Google activa');
      }
      await deleteFileFromDrive(fileId, accessToken);
      return fileId;
    },
    onMutate: async (fileId) => {
      // Cancelar cualquier refetch en progreso
      await queryClient.cancelQueries({
        queryKey: getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
      });

      // Guardar el estado anterior para rollback
      const previousFiles = queryClient.getQueryData<AttachedFile[]>(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId)
      );

      // Actualización optimista: eliminar del caché inmediatamente
      queryClient.setQueryData<AttachedFile[]>(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
        (oldFiles = []) => oldFiles.filter((f) => f.id !== fileId)
      );

      return { previousFiles };
    },
    onError: (error: Error, _fileId, context) => {
      // Rollback en caso de error
      if (context?.previousFiles) {
        queryClient.setQueryData(
          getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
          context.previousFiles
        );
      }
      onError?.(error);
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });
}

interface UseCreatePatientFolderMutationOptions {
  patientRut: string;
  patientName: string;
  patientDriveFolderId?: string | null;
  onSuccess?: (result: { id: string; webViewLink: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para crear la carpeta del paciente en Drive
 */
export function useCreatePatientFolder({
  patientRut,
  patientName,
  patientDriveFolderId,
  onSuccess,
  onError,
}: UseCreatePatientFolderMutationOptions) {
  const queryClient = useQueryClient();
  const accessToken = sessionStorage.getItem('google_access_token');

  return useMutation({
    mutationFn: async () => {
      if (!accessToken) {
        throw new Error('No hay sesión de Google activa');
      }
      return createPatientDriveFolder(patientRut, patientName, accessToken, patientDriveFolderId);
    },
    onSuccess: (result) => {
      // Refetch de archivos después de crear la carpeta
      queryClient.invalidateQueries({
        queryKey: getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
      });
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
}

/**
 * Hook utilitario para prefetch de archivos de paciente.
 * Útil para cargar datos en background cuando el usuario hover sobre un paciente.
 */
export function usePrefetchPatientFiles() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    async (patientRut: string, patientName: string, patientDriveFolderId?: string | null) => {
      const accessToken = sessionStorage.getItem('google_access_token');
      if (!accessToken || !patientRut || !patientName) return;

      // Solo prefetch si no hay datos en caché
      const cached = queryClient.getQueryData(
        getPatientFilesKey(patientRut, patientName, patientDriveFolderId)
      );
      if (cached) return;

      await queryClient.prefetchQuery({
        queryKey: getPatientFilesKey(patientRut, patientName, patientDriveFolderId),
        queryFn: () => fetchPatientFolderFiles(accessToken, patientRut, patientName, patientDriveFolderId),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { prefetch };
}

/**
 * Hook para invalidar todos los cachés de archivos de pacientes.
 * Útil después de operaciones masivas o cambios de sesión.
 */
export function useInvalidateAllPatientFiles() {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: ['patientFiles'],
    });
  }, [queryClient]);

  return { invalidateAll };
}

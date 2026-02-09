import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import {
  usePatientFiles,
  useUploadPatientFileFirebase,
  useDeletePatientFileFirebase,
  useInvalidateAllPatientFiles,
} from '@features/files/hooks/usePatientFiles';

vi.mock('@services/firebaseStorageService', () => ({
  uploadFileToFirebase: vi.fn(async (_file: File, _patientId: string) => ({ id: 'f1', name: 'doc.pdf' })),
  deleteFileFromFirebase: vi.fn(async () => undefined),
  downloadFileBlobFromFirebaseUrl: vi.fn(async () => new Blob(['x'], { type: 'application/pdf' })),
}));

const createWrapper = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('usePatientFiles', () => {
  it('returns no-op defaults', () => {
    const { result } = renderHook(() => usePatientFiles({
      patientRut: '1-9',
      patientName: 'Paciente',
    }));

    expect(result.current.files).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasCachedData).toBe(false);
    expect(result.current.getCachedData()).toEqual([]);
  });

  it('uploads file via Firebase hook', async () => {
    const client = new QueryClient();
    const wrapper = createWrapper(client);
    const { result } = renderHook(
      () => useUploadPatientFileFirebase({ patientId: 'patient-1', patientRut: '1-9', patientName: 'Paciente' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    });

    const { uploadFileToFirebase } = await import('@services/firebaseStorageService');
    expect(uploadFileToFirebase).toHaveBeenCalledWith(expect.any(File), 'patient-1');
  });

  it('calls onError when upload fails', async () => {
    const client = new QueryClient();
    const wrapper = createWrapper(client);
    const onError = vi.fn();
    const { uploadFileToFirebase } = await import('@services/firebaseStorageService');

    (uploadFileToFirebase as any).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(
      () => useUploadPatientFileFirebase({ patientId: 'patient-1', patientRut: '1-9', patientName: 'Paciente', onError }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
      } catch {
        // expected
      }
    });

    expect(onError).toHaveBeenCalled();
  });

  it('deletes file via Firebase hook and shows toast', async () => {
    const client = new QueryClient();
    const wrapper = createWrapper(client);
    const addToast = vi.fn();

    const { result } = renderHook(
      () => useDeletePatientFileFirebase({ addToast }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({ patientId: 'patient-1', fileName: 'doc.pdf', fileId: 'f1' });
    });

    const { deleteFileFromFirebase } = await import('@services/firebaseStorageService');
    expect(deleteFileFromFirebase).toHaveBeenCalledWith('patient-1', 'doc.pdf', 'f1');
    expect(addToast).toHaveBeenCalledWith('success', 'Archivo eliminado de Firebase');
  });

  it('shows error toast when delete fails', async () => {
    const client = new QueryClient();
    const wrapper = createWrapper(client);
    const addToast = vi.fn();
    const { deleteFileFromFirebase } = await import('@services/firebaseStorageService');

    (deleteFileFromFirebase as any).mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(
      () => useDeletePatientFileFirebase({ addToast }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ patientId: 'patient-1', fileName: 'doc.pdf', fileId: 'f1' });
      } catch {
        // expected
      }
    });

    expect(addToast).toHaveBeenCalledWith('error', 'Error al eliminar de Firebase: fail');
  });

  it('invalidates patient file queries', async () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const wrapper = createWrapper(client);
    const { result } = renderHook(() => useInvalidateAllPatientFiles(), { wrapper });

    await act(async () => {
      await result.current.invalidateAll();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['patientFiles'] });
  });

  it('exposes deprecated hooks without crashing', async () => {
    const client = new QueryClient();
    const wrapper = createWrapper(client);
    const { useUploadPatientFile, useDeletePatientFile, useCreatePatientFolder, usePrefetchPatientFiles } = await import('@features/files/hooks/usePatientFiles');
    const { result } = renderHook(() => useUploadPatientFile({ patientRut: '1-9', patientName: 'Paciente' }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
    });

    const deleteResult = useDeletePatientFile({});
    const createResult = useCreatePatientFolder({});
    const prefetchResult = usePrefetchPatientFiles();

    await deleteResult.mutateAsync();
    await createResult.mutateAsync();
    await prefetchResult.prefetch();
  });
});

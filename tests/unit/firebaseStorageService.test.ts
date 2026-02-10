import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadFileToFirebase,
  updateFileInFirebase,
  updateFileInFirebaseById,
  deleteFileFromFirebase,
  listPatientFilesFromFirebase,
  downloadFileBlobFromFirebaseUrl,
  downloadFileBlobFromFirebaseById,
} from '@services/firebaseStorageService';

vi.mock('@services/firebase/auth', () => ({
  getAuthInstance: vi.fn(),
}));

vi.mock('@services/firebase/storage', () => ({
  getStorageInstance: vi.fn(),
}));

vi.mock('@services/logger', () => ({
  emitStructuredLog: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage: unknown, path: string) => ({ path })),
  listAll: vi.fn(async () => ({ items: [] })),
  uploadBytes: vi.fn(async (_ref: unknown, _file: File) => ({ ref: { path: 'ref' } })),
  getDownloadURL: vi.fn(async () => 'https://download/url'),
  getMetadata: vi.fn(async () => ({
    contentType: 'application/pdf',
    size: '10',
    timeCreated: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  })),
  deleteObject: vi.fn(async () => undefined),
  getBlob: vi.fn(async () => new Blob(['x'], { type: 'text/plain' })),
}));

describe('firebaseStorageService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: () => 'uuid-1' },
      configurable: true,
    });
  });

  it('throws when Firebase is not configured', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');

    (getStorageInstance as any).mockResolvedValue(null);
    (getAuthInstance as any).mockResolvedValue(null);

    await expect(uploadFileToFirebase(new File(['a'], 'a.txt'), 'patient-1'))
      .rejects.toThrow('Firebase not configured');
  });

  it('uploads file and returns metadata', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });

    const result = await uploadFileToFirebase(new File(['a'], 'a.txt', { type: 'text/plain' }), 'patient-1');

    expect(result).toEqual(
      expect.objectContaining({
        id: 'uuid-1',
        name: 'a.txt',
        mimeType: 'text/plain',
        driveUrl: 'https://download/url',
      })
    );
  });

  it('stores uploads using opaque object name (without original filename)', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { uploadBytes } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });

    await uploadFileToFirebase(
      new File(['a'], 'elena_araki_16-01.pdf', { type: 'application/pdf' }),
      'patient-1'
    );

    const storageRef = (uploadBytes as any).mock.calls[0]?.[0];
    expect(storageRef.path).toContain('/uuid-1.pdf');
    expect(storageRef.path).not.toContain('elena_araki_16-01');
  });

  it('updates existing file and keeps file identity', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { uploadBytes } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });

    const result = await updateFileInFirebase(
      new File(['updated'], 'ignored-name.json', { type: 'application/json' }),
      'patient-1',
      'file-1',
      'report.json'
    );

    expect(uploadBytes).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'file-1',
        name: 'report.json',
        mimeType: 'application/json',
        driveUrl: 'https://download/url',
      })
    );
  });

  it('logs and rethrows upload errors', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { uploadBytes } = await import('firebase/storage');
    const { emitStructuredLog } = await import('@services/logger');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (uploadBytes as any).mockRejectedValueOnce(new Error('upload failed'));

    await expect(uploadFileToFirebase(new File(['a'], 'a.txt'), 'patient-1')).rejects.toThrow('upload failed');
    expect(emitStructuredLog).toHaveBeenCalledWith(
      'error',
      'FirebaseStorage',
      'Error uploading file',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('deletes file when authenticated', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { deleteObject } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });

    await deleteFileFromFirebase('patient-1', 'file.txt', 'file-1');

    expect(deleteObject).toHaveBeenCalledTimes(1);
  });

  it('logs delete errors', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { deleteObject } = await import('firebase/storage');
    const { emitStructuredLog } = await import('@services/logger');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (deleteObject as any).mockRejectedValueOnce(new Error('delete failed'));

    await deleteFileFromFirebase('patient-1', 'file.txt', 'file-1');
    expect(emitStructuredLog).toHaveBeenCalledWith(
      'error',
      'FirebaseStorage',
      'Error deleting file',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('downloads a blob from Firebase url', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});

    const blob = await downloadFileBlobFromFirebaseUrl('gs://bucket/file');
    expect(blob).toBeInstanceOf(Blob);
  });

  it('downloads a blob from https url via fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          base64: btoa('json'),
          mimeType: 'application/json',
        }),
        { status: 200 }
      )
    );

    const blob = await downloadFileBlobFromFirebaseUrl('https://firebasestorage.googleapis.com/v0/b/file');
    expect(blob.size).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });

  it('downloads non-firebase https url directly', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(new Blob(['plain'], { type: 'text/plain' }), { status: 200 })
    );

    const blob = await downloadFileBlobFromFirebaseUrl('https://example.com/plain.txt');
    expect(blob.size).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://example.com/plain.txt',
      expect.objectContaining({ method: 'GET' })
    );

    fetchSpy.mockRestore();
  });

  it('downloads blob by patientId and fileId when filename metadata is missing', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, getDownloadURL } = await import('firebase/storage');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          base64: btoa('json'),
          mimeType: 'application/json',
        }),
        { status: 200 }
      )
    );

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [{ name: 'file-123_report.json', path: 'users/user-1/patients/patient-1/file-123_report.json' }],
    });
    (getDownloadURL as any).mockResolvedValueOnce(
      'https://firebasestorage.googleapis.com/v0/b/medidiario/o/users%2Fu%2Fpatients%2Fp%2Ffile-123_report.json?alt=media'
    );

    const blob = await downloadFileBlobFromFirebaseById('patient-1', 'file-123');
    expect(blob).toBeInstanceOf(Blob);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('downloads blob by patientId and fileId even when filename metadata is stale', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, getDownloadURL } = await import('firebase/storage');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          base64: btoa('json'),
          mimeType: 'application/json',
        }),
        { status: 200 }
      )
    );

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [{ name: 'file-stale_real-name.json', path: 'users/user-1/patients/patient-1/file-stale_real-name.json' }],
    });
    (getDownloadURL as any).mockResolvedValueOnce(
      'https://firebasestorage.googleapis.com/v0/b/medidiario/o/users%2Fu%2Fpatients%2Fp%2Ffile-stale_real-name.json?alt=media'
    );

    await downloadFileBlobFromFirebaseById('patient-1', 'file-stale', 'old-name.json');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('updates file by patientId and fileId when filename metadata is missing', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, uploadBytes } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [{ name: 'file-abc_informe.json', path: 'users/user-1/patients/patient-1/file-abc_informe.json' }],
    });

    const result = await updateFileInFirebaseById(
      new File(['updated'], 'ignored.json', { type: 'application/json' }),
      'patient-1',
      'file-abc'
    );

    expect(uploadBytes).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'file-abc',
        name: 'informe.json',
        mimeType: 'application/json',
      })
    );
  });

  it('updates file by patientId and fileId even when filename metadata is stale', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, uploadBytes } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [{ name: 'file-stale_current-name.json', path: 'users/user-1/patients/patient-1/file-stale_current-name.json' }],
    });

    const result = await updateFileInFirebaseById(
      new File(['updated'], 'ignored.json', { type: 'application/json' }),
      'patient-1',
      'file-stale',
      'old-name.json'
    );

    expect(uploadBytes).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'file-stale',
        name: 'current-name.json',
      })
    );
  });

  it('lists patient files from storage for metadata recovery', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, getDownloadURL } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [
        { name: 'file-1_reporte.pdf', path: 'users/user-1/patients/patient-1/file-1_reporte.pdf' },
      ],
    });
    (getDownloadURL as any).mockResolvedValueOnce('https://download/url/file-1');

    const files = await listPatientFilesFromFirebase('patient-1');
    expect(files).toHaveLength(1);
    expect(files[0]).toEqual(expect.objectContaining({
      id: 'file-1',
      name: 'reporte.pdf',
      driveUrl: 'https://download/url/file-1',
    }));
  });

  it('keeps deterministic unique ids for legacy names with underscores', async () => {
    const { getStorageInstance } = await import('@services/firebase/storage');
    const { getAuthInstance } = await import('@services/firebase/auth');
    const { listAll, getDownloadURL } = await import('firebase/storage');

    (getStorageInstance as any).mockResolvedValue({});
    (getAuthInstance as any).mockResolvedValue({ currentUser: { uid: 'user-1' } });
    (listAll as any).mockResolvedValueOnce({
      items: [
        { name: 'evolucion_medica_16-02.pdf', path: 'users/user-1/patients/patient-1/evolucion_medica_16-02.pdf' },
        { name: 'evolucion_medica_17-02.pdf', path: 'users/user-1/patients/patient-1/evolucion_medica_17-02.pdf' },
      ],
    });
    (getDownloadURL as any)
      .mockResolvedValueOnce('https://download/url/legacy-1')
      .mockResolvedValueOnce('https://download/url/legacy-2');

    const files = await listPatientFilesFromFirebase('patient-1');
    expect(files).toHaveLength(2);
    expect(files[0].id).toContain('legacy-');
    expect(files[1].id).toContain('legacy-');
    expect(files[0].id).not.toBe(files[1].id);
  });
});

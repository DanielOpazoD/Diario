import type { AttachedFile, PatientRecord } from '@shared/types';
import { listAllPatientFiles } from '@use-cases/attachments';

type PatientFilesMap = Record<string, AttachedFile[]>;

const normalizeRut = (rut: string) => rut.trim().toLowerCase();

const dedupeFiles = (files: AttachedFile[]): AttachedFile[] => {
  const byKey = new Map<string, AttachedFile>();
  files.forEach((file) => {
    const key = file.id || file.driveUrl || `${file.name}-${file.uploadedAt}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, file);
      return;
    }
    if ((file.uploadedAt ?? 0) >= (existing.uploadedAt ?? 0)) {
      byKey.set(key, file);
    }
  });
  return Array.from(byKey.values()).sort((left, right) => (right.uploadedAt ?? 0) - (left.uploadedAt ?? 0));
};

const haveSameFileSet = (left: AttachedFile[], right: AttachedFile[]) => {
  if (left.length !== right.length) return false;
  const toKeySet = (files: AttachedFile[]) => new Set(files.map((file) => `${file.id}::${file.driveUrl}::${file.name}`));
  const leftKeys = toKeySet(left);
  const rightKeys = toKeySet(right);
  if (leftKeys.size !== rightKeys.size) return false;
  for (const key of leftKeys) {
    if (!rightKeys.has(key)) return false;
  }
  return true;
};

export interface AttachmentRepairResult {
  records: PatientRecord[];
  scannedPatientFolders: number;
  scannedFiles: number;
  repairedPatients: number;
  recoveredFiles: number;
  linkedByRutPatients: number;
}

interface RepairDeps {
  listAllPatientFilesFn: () => Promise<PatientFilesMap>;
}

export const createRepairPatientAttachments = ({ listAllPatientFilesFn }: RepairDeps) =>
  async (records: PatientRecord[]): Promise<AttachmentRepairResult> => {
    const storageMap = await listAllPatientFilesFn();
    const scannedPatientFolders = Object.keys(storageMap).length;
    const scannedFiles = Object.values(storageMap).reduce((sum, files) => sum + files.length, 0);

    const directFilesById = new Map<string, AttachedFile[]>();
    records.forEach((record) => {
      const fromStorage = storageMap[record.id] || [];
      directFilesById.set(record.id, dedupeFiles([...(record.attachedFiles || []), ...fromStorage]));
    });

    const rutPool = new Map<string, AttachedFile[]>();
    records.forEach((record) => {
      const normalizedRut = normalizeRut(record.rut || '');
      if (!normalizedRut) return;
      const files = directFilesById.get(record.id) || [];
      if (files.length === 0) return;
      const existing = rutPool.get(normalizedRut) || [];
      rutPool.set(normalizedRut, dedupeFiles([...existing, ...files]));
    });

    let repairedPatients = 0;
    let recoveredFiles = 0;
    let linkedByRutPatients = 0;

    const now = Date.now();
    const nextRecords = records.map((record) => {
      const directFiles = directFilesById.get(record.id) || [];
      let repaired = directFiles;
      let usedRutFallback = false;

      if (repaired.length === 0) {
        const byRut = rutPool.get(normalizeRut(record.rut || '')) || [];
        if (byRut.length > 0) {
          repaired = byRut;
          usedRutFallback = true;
        }
      }

      if (repaired.length === 0) return record;
      if (haveSameFileSet(record.attachedFiles || [], repaired)) return record;

      repairedPatients += 1;
      recoveredFiles += repaired.length;
      if (usedRutFallback) linkedByRutPatients += 1;

      return {
        ...record,
        attachedFiles: repaired,
        updatedAt: Math.max(record.updatedAt ?? 0, now),
      };
    });

    return {
      records: nextRecords,
      scannedPatientFolders,
      scannedFiles,
      repairedPatients,
      recoveredFiles,
      linkedByRutPatients,
    };
  };

export const repairPatientAttachmentsGlobally = createRepairPatientAttachments({
  listAllPatientFilesFn: listAllPatientFiles,
});


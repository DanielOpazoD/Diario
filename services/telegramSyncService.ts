import { listFolderEntries, downloadFile } from './googleService';
import { PatientRecord } from '../shared/types/index.ts';

const INBOX_FOLDER_NAME = 'MediDiario_Inbox';

interface DriveFileEntry {
  id: string;
  name: string;
  mimeType?: string;
}

const ensureInboxFolderId = async (token: string): Promise<string> => {
  const { files = [] } = await listFolderEntries(token);
  const folder = files.find(
    (file: DriveFileEntry) => file.mimeType === 'application/vnd.google-apps.folder' && file.name === INBOX_FOLDER_NAME,
  );

  if (!folder?.id) {
    throw new Error('No se encontró la carpeta MediDiario_Inbox en Drive');
  }

  return folder.id;
};

const normalizePatientRecord = (raw: any): PatientRecord | null => {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.name || !raw.rut || !raw.diagnosis || !raw.date) return null;

  return {
    id: String(raw.id),
    name: String(raw.name),
    rut: String(raw.rut),
    birthDate: raw.birthDate,
    gender: raw.gender,
    date: String(raw.date),
    type: raw.type || 'Policlínico',
    entryTime: raw.entryTime,
    exitTime: raw.exitTime,
    diagnosis: String(raw.diagnosis),
    clinicalNote: raw.clinicalNote || '',
    pendingTasks: Array.isArray(raw.pendingTasks) ? raw.pendingTasks : [],
    attachedFiles: Array.isArray(raw.attachedFiles) ? raw.attachedFiles : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
};

const readPatientsFromFiles = async (token: string, files: DriveFileEntry[]) => {
  const aggregated: PatientRecord[] = [];

  for (const file of files) {
    try {
      const data = await downloadFile(file.id, token);
      const records = Array.isArray(data) ? data : [];
      records.forEach((entry: any) => {
        const parsed = normalizePatientRecord(entry);
        if (parsed) {
          aggregated.push(parsed);
        }
      });
    } catch (error) {
      console.error('No se pudo leer', file.name, error);
    }
  }

  return aggregated;
};

const mergeRecords = (existingRecords: PatientRecord[], incomingRecords: PatientRecord[]) => {
  const existingIds = new Set(existingRecords.map((record) => record.id));
  const uniqueIncoming = incomingRecords.filter((record) => !existingIds.has(record.id));

  return { mergedRecords: [...existingRecords, ...uniqueIncoming], newPatients: uniqueIncoming };
};

export const syncPatientsFromTelegram = async (token: string, existingRecords: PatientRecord[]) => {
  const inboxId = await ensureInboxFolderId(token);
  const { files = [] } = await listFolderEntries(token, inboxId);
  const patientFiles = files.filter(
    (file: DriveFileEntry) => file.name?.startsWith('pacientes-') && file.name.endsWith('.json'),
  );

  const incomingRecords = await readPatientsFromFiles(token, patientFiles);
  return mergeRecords(existingRecords, incomingRecords);
};

export const syncPatientsForDate = async (
  token: string,
  existingRecords: PatientRecord[],
  dateKey: string,
) => {
  const inboxId = await ensureInboxFolderId(token);
  const targetFileName = `pacientes-${dateKey}.json`;
  const { files = [] } = await listFolderEntries(token, inboxId);
  const patientFiles = files.filter((file: DriveFileEntry) => file.name === targetFileName);

  const incomingRecords = await readPatientsFromFiles(token, patientFiles);
  return mergeRecords(existingRecords, incomingRecords);
};

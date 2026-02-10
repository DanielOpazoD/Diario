import type { PatientRecord } from '@shared/types';
import type { SyncConflictPolicy } from '@shared/config/syncPolicy';
import { arePatientRecordsEquivalent, getPatientVersionVector } from '@use-cases/patient/syncState';

export type ConflictWinner = 'local' | 'remote';

export interface ConflictResolution {
  winner: ConflictWinner;
  reason:
    | 'newer-updatedAt'
    | 'newer-syncMetaUpdatedAt'
    | 'newer-createdAt'
    | 'identical-content'
    | 'equal-timestamp-policy';
}

export const resolvePatientConflict = (
  localRecord: PatientRecord,
  remoteRecord: PatientRecord,
  policy: SyncConflictPolicy
): ConflictResolution => {
  const localVersion = getPatientVersionVector(localRecord);
  const remoteVersion = getPatientVersionVector(remoteRecord);

  if (remoteVersion.updatedAt !== localVersion.updatedAt) {
    return {
      winner: remoteVersion.updatedAt > localVersion.updatedAt ? 'remote' : 'local',
      reason: 'newer-updatedAt',
    };
  }

  if (remoteVersion.syncUpdatedAt !== localVersion.syncUpdatedAt) {
    return {
      winner: remoteVersion.syncUpdatedAt > localVersion.syncUpdatedAt ? 'remote' : 'local',
      reason: 'newer-syncMetaUpdatedAt',
    };
  }

  if (remoteVersion.createdAt !== localVersion.createdAt) {
    return {
      winner: remoteVersion.createdAt > localVersion.createdAt ? 'remote' : 'local',
      reason: 'newer-createdAt',
    };
  }

  if (arePatientRecordsEquivalent(localRecord, remoteRecord)) {
    return {
      winner: 'local',
      reason: 'identical-content',
    };
  }

  return {
    winner: policy === 'newer-wins-remote-tie' ? 'remote' : 'local',
    reason: 'equal-timestamp-policy',
  };
};

export const isLocalRecordWithinGracePeriod = (
  localRecord: PatientRecord,
  now: number,
  gracePeriodMs: number
) => {
  const { updatedAt, createdAt } = getPatientVersionVector(localRecord);
  const freshestKnownTimestamp = Math.max(updatedAt, createdAt);
  if (freshestKnownTimestamp <= 0) return true;
  return now - freshestKnownTimestamp < gracePeriodMs;
};

import type { PatientRecord } from '@shared/types';
import type { SyncConflictPolicy } from '@shared/config/syncPolicy';
import { SYNC_POLICY } from '@shared/config/syncPolicy';
import { isLocalRecordWithinGracePeriod, resolvePatientConflict } from '@use-cases/patient/syncConflict';
import { arePatientRecordsEquivalent } from '@use-cases/patient/syncState';

export type SyncChangeType = 'update' | 'remove' | 'add';

export interface SyncChange {
  type: SyncChangeType;
  id: string;
}

export interface SyncMergeResult {
  records: PatientRecord[];
  hasChanges: boolean;
  changes: SyncChange[];
  stats: {
    conflicts: number;
    protectedRemovals: number;
    staleRemovals: number;
  };
}

const shouldProtectMassRemoval = (
  localCount: number,
  remoteCount: number,
  removeCandidateCount: number
) => {
  if (!SYNC_POLICY.dropoutProtectionEnabled) return false;
  if (localCount < SYNC_POLICY.dropoutProtectionMinLocalCount) return false;
  if (removeCandidateCount === 0) return false;

  const removalRatio = removeCandidateCount / localCount;
  const remoteRatio = localCount > 0 ? remoteCount / localCount : 1;

  return (
    removalRatio >= SYNC_POLICY.dropoutProtectionMaxRemovalRatio &&
    remoteRatio <= SYNC_POLICY.dropoutProtectionMaxRemoteRatio
  );
};

export const reconcilePatientRecords = (
  localRecords: PatientRecord[],
  remoteRecords: PatientRecord[],
  now: number,
  gracePeriodMs: number,
  policy: SyncConflictPolicy = SYNC_POLICY.conflictPolicy
): SyncMergeResult => {
  const remoteMap = new Map(remoteRecords.map((patient) => [patient.id, patient]));
  const updatedRecords: PatientRecord[] = [];
  const changes: SyncChange[] = [];
  const removeCandidates: PatientRecord[] = [];
  const stats = {
    conflicts: 0,
    protectedRemovals: 0,
    staleRemovals: 0,
  };

  localRecords.forEach((local) => {
    const remote = remoteMap.get(local.id);

    if (remote) {
      const conflict = resolvePatientConflict(local, remote, policy);
      if (conflict.reason !== 'identical-content') {
        stats.conflicts += 1;
      }
      if (conflict.winner === 'remote') {
        if (!arePatientRecordsEquivalent(local, remote)) {
          updatedRecords.push(remote);
          changes.push({ type: 'update', id: local.id });
        } else {
          updatedRecords.push(local);
        }
      } else {
        updatedRecords.push(local);
      }
    } else {
      if (isLocalRecordWithinGracePeriod(local, now, gracePeriodMs)) {
        updatedRecords.push(local);
      } else {
        removeCandidates.push(local);
      }
    }
  });

  const protectRemoval = shouldProtectMassRemoval(
    localRecords.length,
    remoteRecords.length,
    removeCandidates.length
  );
  if (protectRemoval) {
    updatedRecords.push(...removeCandidates);
    stats.protectedRemovals = removeCandidates.length;
  } else {
    removeCandidates.forEach((record) => {
      changes.push({ type: 'remove', id: record.id });
    });
    stats.staleRemovals = removeCandidates.length;
  }

  const localIds = new Set(localRecords.map((patient) => patient.id));
  remoteRecords.forEach((remote) => {
    if (!localIds.has(remote.id)) {
      updatedRecords.push(remote);
      changes.push({ type: 'add', id: remote.id });
    }
  });

  return {
    records: updatedRecords,
    hasChanges: changes.length > 0,
    changes,
    stats,
  };
};

export type SyncConflictPolicy = 'newer-wins-local-tie' | 'newer-wins-remote-tie';

export const SYNC_POLICY = {
  mergeGracePeriodMs: 30_000,
  conflictPolicy: 'newer-wins-local-tie' as SyncConflictPolicy,
  dropoutProtectionEnabled: true,
  dropoutProtectionMinLocalCount: 8,
  dropoutProtectionMaxRemovalRatio: 0.45,
  dropoutProtectionMaxRemoteRatio: 0.35,
  maxConsecutiveSyncFailures: 3,
  syncCooldownMs: 15_000,
  cooldownLogWindowMs: 10_000,
  retryBackoffMaxMs: 4_000,
} as const;

import { PatientRecord, GeneralTask, Bookmark, BookmarkCategory, User, PatientTypeConfig } from '@shared/types';
import { getPatientSyncStateSignature } from '@use-cases/patient/syncState';

export interface PersistenceState {
    records: PatientRecord[];
    generalTasks: GeneralTask[];
    bookmarks: Bookmark[];
    bookmarkCategories: BookmarkCategory[];
    user: User | null;
    theme: 'light' | 'dark' | 'system';
    patientTypes: PatientTypeConfig[];
    securityPinHash: string | null;
    securityPinSalt: string | null;
    autoLockMinutes: number;
    highlightPendingPatients: boolean;
    compactStats: boolean;
    showBookmarkBar: boolean;
}

export interface PersistenceDependencies {
    saveToLocal: (state: PersistenceState) => void;
    shadowWrite: (state: PersistenceState) => Promise<void>;
    syncToRemote: (dirtyPatients: PatientRecord[], user: User) => Promise<void>;
    onSyncStatusChange: (status: 'idle' | 'saving' | 'synced' | 'error', timestamp?: number | null) => void;
    logEvent: (level: 'info' | 'warn' | 'error', category: string, message: string, meta?: any) => void;
    syncCooldownMs: number;
    maxConsecutiveFailures: number;
    cooldownLogWindowMs: number;
}

export class PersistenceManager {
    private lastSyncedHashes = new Map<string, string>();
    private syncFailureCount = 0;
    private syncCooldownUntil = 0;
    private lastCooldownLogAt = 0;

    constructor(private deps: PersistenceDependencies) { }

    public async persistSnapshot(state: PersistenceState, now: number = Date.now()): Promise<void> {
        // 1. Local Storage Saves
        this.deps.saveToLocal(state);

        // 2. IndexedDB Shadow Write
        this.deps.shadowWrite(state).catch(error => {
            this.deps.logEvent('warn', 'Persistence', 'IndexedDB shadow write failed', { error });
        });

        // 3. Remote Sync Checks
        if (!state.user) {
            this.markSyncSuccess();
            this.deps.onSyncStatusChange('synced', now);
            return;
        }

        if (now < this.syncCooldownUntil) {
            this.maybeLogSyncCooldown(now);
            this.deps.onSyncStatusChange('error');
            return;
        }

        const dirtyPatients = state.records.filter((patient) => {
            const currentSignature = getPatientSyncStateSignature(patient);
            const lastSyncSignature = this.lastSyncedHashes.get(patient.id);
            return lastSyncSignature === undefined || currentSignature !== lastSyncSignature;
        });

        if (dirtyPatients.length === 0) {
            this.markSyncSuccess();
            this.deps.onSyncStatusChange('synced', now);
            return;
        }

        // 4. Execute Remote Sync
        try {
            this.deps.logEvent('info', 'Persistence', `Syncing ${dirtyPatients.length} dirty patients to Firebase...`);

            await this.deps.syncToRemote(dirtyPatients, state.user);

            // Update hashes on success
            dirtyPatients.forEach((patient) => {
                this.lastSyncedHashes.set(patient.id, getPatientSyncStateSignature(patient));
            });

            this.markSyncSuccess();
            this.deps.logEvent('info', 'Persistence', 'Sincronizacion incremental exitosa');
            this.deps.onSyncStatusChange('synced', Date.now());
        } catch (error) {
            this.markSyncFailure(error, now);
            this.deps.onSyncStatusChange('error');
        }
    }

    public resetState(): void {
        this.syncFailureCount = 0;
        this.syncCooldownUntil = 0;
        this.lastCooldownLogAt = 0;
        this.lastSyncedHashes.clear();
    }

    private maybeLogSyncCooldown(now: number) {
        const withinWindow = now - this.lastCooldownLogAt < this.deps.cooldownLogWindowMs;
        if (withinWindow) return;
        this.lastCooldownLogAt = now;
        this.deps.logEvent('warn', 'Persistence', 'Sync cooldown active after repeated failures', {
            retryAfterMs: Math.max(0, this.syncCooldownUntil - now),
            failuresBeforeCooldown: this.deps.maxConsecutiveFailures,
        });
    }

    private markSyncSuccess() {
        this.syncFailureCount = 0;
        this.syncCooldownUntil = 0;
    }

    private markSyncFailure(error: unknown, now: number) {
        this.syncFailureCount += 1;
        if (this.syncFailureCount >= this.deps.maxConsecutiveFailures) {
            this.syncCooldownUntil = now + this.deps.syncCooldownMs;
            this.syncFailureCount = 0;
        }
        this.deps.logEvent('error', 'Persistence', 'Error syncing dirty patients', { error });
    }
}
